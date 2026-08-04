import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FolderPen,
  Layers3,
  RefreshCw,
  X,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import HoSoTrucTuyen from "./HoSoTrucTuyen";

const NHOM_MOI_TRANG = 25;

const danhSachKhoa = (rows) =>
  [...new Set(rows.map((r) => r.don_vi).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));

function gomTheoMaHang(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const key = `${r.ma_hang}|||${r.dvt || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        ...r,
        so_luong: 0,
        khoa_de_xuat: [],
        dong_nguon: [],
        ghi_chu: "",
      });
    }
    const g = map.get(key);
    g.so_luong += Number(r.so_luong) || 0;
    g.khoa_de_xuat.push(r.don_vi);
    g.dong_nguon.push({
      id: r.id,
      don_vi: r.don_vi,
      so_luong: Number(r.so_luong) || 0,
      nhom_de_xuat: r.nhom_de_xuat,
    });
    const ghiChu = [g.ghi_chu, r.ghi_chu].filter(Boolean);
    g.ghi_chu = [...new Set(ghiChu)].join(" | ");
  });
  return [...map.values()]
    .map((g) => ({
      ...g,
      khoa_de_xuat: [...new Set(g.khoa_de_xuat)].sort((a, b) => a.localeCompare(b, "vi")),
      don_vi: [...new Set(g.khoa_de_xuat)].join(", "),
    }))
    .sort((a, b) =>
      (a.ma_quan_ly || "zzz").localeCompare(b.ma_quan_ly || "zzz", "vi")
      || (a.ma_hang || "").localeCompare(b.ma_hang || "", "vi"));
}

function timCanhBaoDvt(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!r.ma_quan_ly) return;
    if (!map.has(r.ma_quan_ly)) map.set(r.ma_quan_ly, new Set());
    map.get(r.ma_quan_ly).add(r.dvt || "(trống)");
  });
  return [...map.entries()]
    .filter(([, dvts]) => dvts.size > 1)
    .map(([ma, dvts]) => ({ ma, dvts: [...dvts] }));
}

export default function TongHopPhongDieuDuong({
  profile,
  goi,
  dot,
  dotIdKhoiTao = "",
  donViKhoiTao = "",
  nguonKeyKhoiTao = "",
}) {
  const [rows, setRows] = useState([]);
  const [dots, setDots] = useState([]);
  const [dotId, setDotId] = useState(dotIdKhoiTao ? String(dotIdKhoiTao) : (dot?.id ? String(dot.id) : ""));
  const [usage, setUsage] = useState({});
  const [cheDo, setCheDo] = useState("khoa");
  const [khoaLoc, setKhoaLoc] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [moDong, setMoDong] = useState(null);
  const [nhomMo, setNhomMo] = useState(() => new Set());
  const [trang, setTrang] = useState(1);
  const [phien, setPhien] = useState(null);
  const [khoaHoSo, setKhoaHoSo] = useState("");
  // nguon_key thật của bộ hồ sơ đang mở — KHÔNG được hard-code "current".
  // ĐVSD tạo hồ sơ qua "Hồ sơ của khoa" dùng nguon_key="bo:<uuid>" riêng theo
  // từng giỏ (patch T). "current" là quy ước CŨ trước patch T, chỉ còn dùng
  // làm giá trị dự phòng khi một khoa chưa hề tạo bộ hồ sơ nào theo cách mới.
  const [nguonKeyHoSo, setNguonKeyHoSo] = useState("");
  const [trangThaiHoSoKhoa, setTrangThaiHoSoKhoa] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangChot, setDangChot] = useState(false);
  const [xacNhanDvt, setXacNhanDvt] = useState(false);
  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [chuaPatch, setChuaPatch] = useState(false);
  const [dsKhoaToanVien, setDsKhoaToanVien] = useState([]);
  const giamChuyenDong = useReducedMotion();

  // Danh sách khoa TOÀN VIỆN — để PĐD thấy được cả khoa CHƯA gửi gì (0 giỏ),
  // không chỉ khoa đã có dữ liệu. Tải 1 lần, không phụ thuộc đợt/gói.
  useEffect(() => {
    supabase.from("v_don_vi").select("don_vi").then(({ data, error }) => {
      if (!error) setDsKhoaToanVien((data || []).map((d) => d.don_vi).filter(Boolean));
    });
  }, []);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const [deXuat, dotRes] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop").select("*")
        .eq("loai_mua_sam", goi)
        .order("created_at", { ascending: false }).range(f, t)),
      supabase.from("dot_de_xuat").select("*")
        .eq("loai_mua_sam", goi)
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false }),
    ]);
    if (deXuat.error) {
      setLoi(`Không đọc được dữ liệu đề xuất: ${deXuat.error.message}`);
      setDangTai(false);
      return;
    }
    let ds = deXuat.data || [];
    const dsDot = dotRes.data || [];
    setDots(dsDot);
    setDotId((cu) => {
      if (cu && dsDot.some((d) => String(d.id) === cu)) return cu;
      if (dotIdKhoiTao && dsDot.some((d) => String(d.id) === String(dotIdKhoiTao))) return String(dotIdKhoiTao);
      if (dot?.id && dsDot.some((d) => d.id === dot.id)) return String(dot.id);
      return dsDot[0]?.id ? String(dsDot[0].id) : "";
    });

    const codes = [...new Set(ds.map((r) => r.ma_hang).filter(Boolean))];
    if (codes.length) {
      const [u, vt] = await Promise.all([
        fetchAllRows((f, t) => supabase.from("v_usage_monthly")
          .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t)),
        fetchAllRows((f, t) => supabase.from("vat_tu")
          .select("ma_hang,ten_thuong_mai,ky_ma_hieu,hang,nuoc_san_xuat,tieu_chi_ky_thuat")
          .in("ma_hang", codes).range(f, t)),
      ]);
      const thongTin = Object.fromEntries((vt.data || []).map((x) => [x.ma_hang, x]));
      ds = ds.map((x) => ({ ...x, ...(thongTin[x.ma_hang] || {}) }));
      const acc = {};
      (u.data || []).forEach((x) => {
        acc[x.ma_hang] = acc[x.ma_hang] || {};
        acc[x.ma_hang][x.nam] = (acc[x.ma_hang][x.nam] || 0) + Number(x.so_luong);
      });
      setUsage(acc);
    } else {
      setUsage({});
    }
    setRows(ds);
    setDangTai(false);
  }, [goi, dot?.id, dotIdKhoiTao]);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);

  const taiPhien = useCallback(async () => {
    setPhien(null);
    setChuaPatch(false);
    if (!dotId) return;
    const { data, error } = await supabase.from("phien_tong_hop").select("*")
      .eq("dot_id", Number(dotId))
      .eq("loai_mua_sam", goi)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      if (error.code === "PGRST205" || /phien_tong_hop/i.test(error.message || "")) setChuaPatch(true);
      else setLoi(error.message);
      return;
    }
    setPhien(data?.[0] || null);
  }, [dotId, goi]);

  useEffect(() => {
    taiPhien();
    setTrang(1);
    setKhoaLoc("");
    setKhoaHoSo(donViKhoiTao || "");
    // Tới từ "Công việc chờ duyệt" thì đã biết đúng nguon_key (patch T). Tới
    // từ nơi khác (chưa chọn khoa) thì để trống, useEffect dưới sẽ tự suy ra
    // bộ mới nhất của khoa này ngay khi trangThaiHoSoKhoa tải xong.
    setNguonKeyHoSo(nguonKeyKhoiTao || "");
    setMoDong(null);
    setXacNhanDvt(false);
    setThongBao("");
  }, [taiPhien, donViKhoiTao, nguonKeyKhoiTao]);

  const taiTrangThaiHoSoKhoa = useCallback(async () => {
    if (!dotId) {
      setTrangThaiHoSoKhoa([]);
      return;
    }
    // KHÔNG lọc theo nguon_key ở đây — mỗi khoa có thể có nhiều bộ hồ sơ (mỗi
    // giỏ một bộ, nguon_key="bo:<uuid>" riêng, patch T). Lọc "current" cứng đã
    // làm PĐD không bao giờ thấy bộ ĐVSD thật sự gửi. Lấy hết, suy ra bộ mới
    // nhất của từng khoa ở nguonKeyTheoKhoa bên dưới.
    const { data, error } = await supabase.from("ho_so_cong_tac")
      .select("don_vi,ma_ho_so,nguon_key,trang_thai,pdd_sua_boi,updated_at")
      .eq("dot_id", Number(dotId))
      .eq("loai_mua_sam", goi)
      .in("ma_ho_so", ["cam_ket_sl", "danh_muc_dvsd"]);
    setTrangThaiHoSoKhoa(error ? [] : data || []);
  }, [dotId, goi]);

  useEffect(() => { taiTrangThaiHoSoKhoa(); }, [taiTrangThaiHoSoKhoa]);

  const trongDot = useMemo(() => rows.filter((r) =>
    dotId && String(r.dot_id) === dotId
  ), [rows, dotId]);
  const daDuyet = useMemo(() => trongDot.filter((r) =>
    r.trang_thai === "hoan_thanh"
  ), [trongDot]);

  const khoa = useMemo(() => danhSachKhoa(daDuyet), [daDuyet]);
  const tongHop = useMemo(() => gomTheoMaHang(daDuyet), [daDuyet]);
  const canhBaoDvt = useMemo(() => timCanhBaoDvt(daDuyet), [daDuyet]);
  const sourceIds = useMemo(() => daDuyet.map((r) => r.id).sort((a, b) => a - b), [daDuyet]);
  const sourceKey = sourceIds.join(",");
  const phienSourceKey = (phien?.noi_dung?.source_ids || []).slice().sort((a, b) => a - b).join(",");
  const phienConMoi = !!phien && sourceKey === phienSourceKey;

  const theoKhoa = useMemo(() => {
    const map = new Map();
    trongDot.forEach((r) => {
      if (!map.has(r.don_vi)) map.set(r.don_vi, { don_vi: r.don_vi, rows: [], nhom: new Set() });
      const g = map.get(r.don_vi);
      g.rows.push(r);
      g.nhom.add(r.nhom_de_xuat || `le:${r.id}`);
    });
    // Hợp thêm khoa TOÀN VIỆN chưa hề có dòng nào trong đợt này — hiện "0 giỏ"
    // thay vì biến mất, để PĐD biết ngay khoa nào còn thiếu chứ không phải đoán.
    dsKhoaToanVien.forEach((donVi) => {
      if (!map.has(donVi)) map.set(donVi, { don_vi: donVi, rows: [], nhom: new Set() });
    });
    return [...map.values()]
      .map((g) => ({ ...g, soNhom: g.nhom.size, chuaGui: g.rows.length === 0 }))
      .sort((a, b) => {
        if (a.chuaGui !== b.chuaGui) return a.chuaGui ? 1 : -1; // khoa chưa gửi xuống cuối
        return a.don_vi.localeCompare(b.don_vi, "vi");
      });
  }, [trongDot, dsKhoaToanVien]);
  const rowsKhoaDangMo = useMemo(
    () => theoKhoa.find((g) => g.don_vi === khoaHoSo)?.rows || [],
    [theoKhoa, khoaHoSo]
  );
  // Bộ hồ sơ MỚI NHẤT của mỗi khoa (nguon_key -> updated_at lớn nhất trong 2
  // tài liệu của bộ đó). Một khoa có thể có nhiều bộ nếu từng tạo lại/gửi
  // nhiều giỏ riêng biệt (patch T) — chỉ bộ mới nhất mới là bộ PĐD cần xét.
  const nguonKeyTheoKhoa = useMemo(() => {
    const gomBo = new Map(); // "don_vi|nguon_key" -> updated_at lớn nhất
    trangThaiHoSoKhoa.forEach((h) => {
      const key = `${h.don_vi}|${h.nguon_key}`;
      const t = h.updated_at || "";
      if (!gomBo.has(key) || t > gomBo.get(key)) gomBo.set(key, t);
    });
    const moiNhat = new Map(); // don_vi -> {nguon_key, updated_at}
    gomBo.forEach((updatedAt, key) => {
      const i = key.lastIndexOf("|");
      const donVi = key.slice(0, i), nguonKey = key.slice(i + 1);
      const hienTai = moiNhat.get(donVi);
      if (!hienTai || updatedAt > hienTai.updated_at) {
        moiNhat.set(donVi, { nguon_key: nguonKey, updated_at: updatedAt });
      }
    });
    return moiNhat;
  }, [trangThaiHoSoKhoa]);

  // CHỈ bù cho đúng 1 tình huống: mở thẳng khoa qua donViKhoiTao (prop) mà
  // KHÔNG có nguonKeyKhoiTao đi kèm. Các lần bấm "Mở Word & Excel của khoa"
  // sau đó đã tự set nguonKeyHoSo ngay tại onClick — effect này không được
  // ghi đè lại, nếu không sẽ chạy mỗi khi trangThaiHoSoKhoa tải lại và xoá
  // mất lựa chọn khoa mới mà người dùng vừa bấm.
  useEffect(() => {
    if (!donViKhoiTao || nguonKeyKhoiTao || khoaHoSo !== donViKhoiTao || nguonKeyHoSo) return;
    const goiY = nguonKeyTheoKhoa.get(donViKhoiTao)?.nguon_key;
    if (goiY) setNguonKeyHoSo(goiY);
  }, [donViKhoiTao, nguonKeyKhoiTao, khoaHoSo, nguonKeyHoSo, nguonKeyTheoKhoa]);

  const trangThaiTheoKhoa = useMemo(() => {
    const map = new Map();
    trangThaiHoSoKhoa.forEach((h) => {
      // Chỉ tính vào badge "x/2 file đã duyệt" của BỘ MỚI NHẤT — gộp cả bộ cũ
      // vào sẽ đếm sai (vd 1 bộ cũ đã duyệt + 1 bộ mới chưa duyệt hiện "1/2"
      // trong khi bộ đang cần xét thực ra là "0/2").
      if (nguonKeyTheoKhoa.get(h.don_vi)?.nguon_key !== h.nguon_key) return;
      if (!map.has(h.don_vi)) map.set(h.don_vi, []);
      map.get(h.don_vi).push(h);
    });
    return map;
  }, [trangThaiHoSoKhoa, nguonKeyTheoKhoa]);

  const tongHopLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    return tongHop.filter((r) => {
      if (khoaLoc && !r.khoa_de_xuat.includes(khoaLoc)) return false;
      if (!q) return true;
      return [r.ma_hang, r.ma_quan_ly, r.ten_vat_tu, r.ten_quan_ly]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [tongHop, khoaLoc, tuKhoa]);

  // Gom CHỈ Ở LỚP HIỂN THỊ theo mã quản lý — KHÔNG đổi cấu trúc `tongHop`
  // (snapshot chốt phiên và file Excel xuất ra vẫn dùng đúng mảng phẳng theo
  // mã hàng như cũ, không phụ thuộc cách sổ xuống trên màn hình).
  const nhomTongHop = useMemo(() => {
    const map = new Map();
    tongHopLoc.forEach((r) => {
      const ma = r.ma_quan_ly || "";
      if (!map.has(ma)) map.set(ma, { ma_quan_ly: ma, ten_quan_ly: r.ten_quan_ly, items: [] });
      map.get(ma).items.push(r);
    });
    return [...map.values()].map((n) => ({
      ...n,
      tongSoLuong: n.items.reduce((s, r) => s + (Number(r.so_luong) || 0), 0),
      soKhoa: new Set(n.items.flatMap((r) => r.khoa_de_xuat)).size,
    }));
  }, [tongHopLoc]);

  const soTrang = Math.max(1, Math.ceil(nhomTongHop.length / NHOM_MOI_TRANG));
  const nhomTrang = nhomTongHop.slice((trang - 1) * NHOM_MOI_TRANG, trang * NHOM_MOI_TRANG);

  useEffect(() => {
    setTrang(1);
  }, [khoaLoc, tuKhoa]);

  const chotPhien = async () => {
    if (!dotId || !tongHop.length) return;
    if (canhBaoDvt.length && !xacNhanDvt) {
      setLoi("Cần kiểm tra và xác nhận các mã quản lý có nhiều đơn vị tính trước khi chốt.");
      return;
    }
    setDangChot(true);
    setLoi("");
    setThongBao("");
    const meta = {
      don_vi: "Toàn viện",
      nguoi_lap: profile.ho_ten || profile.email,
      so_khoa: khoa.length,
      dot_id: Number(dotId),
    };
    const { data, error } = await supabase.from("phien_tong_hop").insert({
      dot_id: Number(dotId),
      loai_mua_sam: goi,
      so_khoa: khoa.length,
      so_dong: tongHop.length,
      created_by: profile.email,
      noi_dung: {
        rows: tongHop,
        source_ids: sourceIds,
        meta,
        usage,
        canh_bao_dvt: canhBaoDvt,
      },
    }).select().single();
    if (error) {
      const canPatch = error.code === "PGRST205" || /phien_tong_hop/i.test(error.message || "");
      setLoi(canPatch
        ? "Staging chưa có bảng snapshot. Cần chạy backend/sql/patch_i_rut_va_tong_hop.sql."
        : error.message);
    } else {
      setPhien(data);
      setThongBao(`Đã chốt phiên bản #${data.id}. Hai file PĐD sẽ dùng đúng snapshot này.`);
    }
    setDangChot(false);
  };

  // Trạng thái BỘ HỒ SƠ (ho_so_cong_tac) và DANH SÁCH ĐỀ XUẤT NGUỒN
  // (proposals -> daDuyet/tongHop) là hai nguồn tách biệt. "Hoàn thành cả bộ"
  // đổi cả hai (RPC chuyen_trang_thai_bo_ho_so tự đồng bộ proposals.trang_thai
  // sang hoan_thanh), nhưng chỉ gọi lại taiTrangThaiHoSoKhoa thì PĐD vẫn thấy
  // "Khoa đã duyệt: 0" cho tới khi tự bấm "Làm mới dữ liệu". Gọi cả hai.
  const lamMoiSauKhiLuuHoSoKhoa = (data) => {
    taiTrangThaiHoSoKhoa();
    taiDuLieu();
    return data;
  };

  // Nối vào onSaved của bộ hồ sơ "Phòng Điều dưỡng" (nguonKey=phien:<id>).
  // HoSoTrucTuyen gọi callback này sau MỌI hành động lưu (lưu nháp, gửi PĐD,
  // bắt đầu xét duyệt, từ chối, hoàn thành) — chỉ khóa khi RPC
  // chuyen_trang_thai_bo_ho_so vừa trả về trạng thái "da_duyet" (= vừa bấm
  // "Hoàn thành cả bộ"), KHÔNG khóa ở các bước trung gian.
  const khoaPhienDaDiThauNeuHoanThanh = async (data) => {
    if (data?.trang_thai !== "da_duyet" || !phien?.id) return;
    const { error } = await supabase.rpc("chot_phien_da_di_thau", { p_phien_id: phien.id });
    if (error) {
      const canPatch = error.code === "PGRST202" || /chot_phien_da_di_thau/i.test(error.message || "");
      setLoi(canPatch
        ? "Staging chưa có hàm khóa theo phiên. Cần chạy backend/sql/patch_y_khoa_da_di_thau_theo_phien.sql."
        : `Đã hoàn thành hồ sơ nhưng CHƯA khóa được đề xuất nguồn: ${error.message}`);
      return;
    }
    setThongBao((t) => `${t} Đã khóa các đề xuất nguồn trong gói này — không hiện lại để đề xuất trùng ở kỳ sau.`);
    taiDuLieu();
  };

  if (dangTai) return <p className="p-4 text-sm text-slate-500">Đang tổng hợp dữ liệu các khoa…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tổng hợp cam kết và đề xuất của khoa</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ dùng đề xuất đã hoàn thành duyệt trong đúng một đợt. Mỗi số tổng đều truy ngược được về khoa gửi.
            </p>
          </div>
          <button type="button" onClick={taiDuLieu}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={13} /> Làm mới dữ liệu
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,2.1fr)] lg:items-end">
          <div className="min-w-0">
            <label className="mb-1.5 block text-xs text-slate-500">Đợt lập hồ sơ</label>
            <div className="relative">
              <select value={dotId} onChange={(e) => setDotId(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">— chọn đợt —</option>
                {dots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ten} · {d.trang_thai === "mo" ? "đang mở" : "đã đóng"}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Khoa đã duyệt", khoa.length],
              ["Khoa chưa gửi", theoKhoa.filter((g) => g.chuaGui).length, true],
              ["Dòng nguồn", daDuyet.length],
              ["Mã sau gộp", tongHop.length],
              ["Cảnh báo ĐVT", canhBaoDvt.length],
            ].map(([nhan, so, canhBao]) => (
              <div key={nhan} className={`rounded-lg px-3 py-2 ${canhBao && so > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
                <p className="text-[11px] text-slate-500">{nhan}</p>
                <p className="mt-0.5 text-lg font-bold text-[var(--umc-navy)]">{so}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {chuaPatch && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>Đang xem được bản tổng hợp thử, nhưng staging chưa có chức năng chốt snapshot. Chạy <b>patch_i_rut_va_tong_hop.sql</b> để mở khoá.</span>
        </div>
      )}
      {loi && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loi}</p>}
      {thongBao && <p className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{thongBao}</p>}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {[
              { ma: "khoa", ten: "Theo khoa", icon: Building2 },
              { ma: "tong_hop", ten: "Tổng hợp theo mã", icon: Layers3 },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.ma} type="button" onClick={() => setCheDo(m.ma)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                    cheDo === m.ma ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}>
                  <Icon size={13} /> {m.ten}
                </button>
              );
            })}
          </div>
          {cheDo === "tong_hop" && (
            <div className="flex flex-wrap gap-2">
              <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm mã, tên vật tư…"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={khoaLoc} onChange={(e) => setKhoaLoc(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                <option value="">Tất cả khoa</option>
                {khoa.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Không mode="wait": nếu animation exit của tab cũ không tick tới
            cùng (máy chậm, tab mất focus...), tab mới chờ vô thời hạn và
            không bao giờ hiện — đã xác nhận bằng bug thật ở KhungGoiThau. */}
        <AnimatePresence initial={false}>
          <motion.div key={cheDo}
            initial={giamChuyenDong ? false : { opacity: 0, transform: "translateY(4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={giamChuyenDong ? { opacity: 0 } : { opacity: 0, transform: "translateY(-2px)" }}>
            {cheDo === "khoa" ? (
              theoKhoa.length ? (
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {theoKhoa.map((g) => {
                    if (g.chuaGui) {
                      return (
                        <div key={g.don_vi} className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3">
                          <div className="flex items-start gap-2">
                            <span className="rounded-md bg-slate-100 p-1.5 text-slate-400"><Building2 size={15} /></span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-500">{g.don_vi}</p>
                              <p className="mt-0.5 text-xs text-slate-400">Chưa gửi đề xuất nào trong đợt này</p>
                            </div>
                            <AlertTriangle size={16} className="ml-auto shrink-0 text-amber-500" />
                          </div>
                        </div>
                      );
                    }
                    const tt = trangThaiTheoKhoa.get(g.don_vi) || [];
                    const daDuyetHoSo = tt.filter((x) => x.trang_thai === "da_duyet").length;
                    const pddDaSua = tt.some((x) => x.pdd_sua_boi);
                    return (
                    <div key={g.don_vi} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start gap-2">
                        <span className="rounded-md bg-teal-50 p-1.5 text-teal-700"><Building2 size={15} /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{g.don_vi}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {g.soNhom} giỏ đề xuất · {g.rows.length} dòng đã gửi
                          </p>
                        </div>
                        <CheckCircle2 size={16} className="ml-auto shrink-0 text-teal-600" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          daDuyetHoSo === 2 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {daDuyetHoSo}/2 file PĐD đã duyệt
                        </span>
                        {pddDaSua && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            PĐD đã sửa trực tiếp
                          </span>
                        )}
                      </div>
                      <button type="button" onClick={() => {
                        setKhoaHoSo(g.don_vi);
                        // Tự tính ngay lúc bấm, không chờ effect — bấm sang
                        // khoa KHÁC với khoa đã mở qua "Công việc chờ duyệt"
                        // (nguonKeyKhoiTao) vẫn phải suy đúng bộ của khoa mới.
                        setNguonKeyHoSo(nguonKeyTheoKhoa.get(g.don_vi)?.nguon_key || "current");
                      }}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100">
                        <ExternalLink size={13} /> Mở Word & Excel của khoa
                      </button>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-slate-400">Chưa có khoa nào gửi đề xuất trong đợt này.</p>
              )
            ) : nhomTongHop.length ? (
              <>
                <div className="divide-y divide-slate-100">
                  {nhomTrang.map((n) => {
                    const moNhom = nhomMo.has(n.ma_quan_ly);
                    return (
                      <div key={n.ma_quan_ly || "(chưa gắn)"}>
                        <button type="button"
                          onClick={() => setNhomMo((p) => {
                            const s = new Set(p);
                            s.has(n.ma_quan_ly) ? s.delete(n.ma_quan_ly) : s.add(n.ma_quan_ly);
                            return s;
                          })}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                          <ChevronRight size={15} className={`shrink-0 text-slate-400 transition-transform ${moNhom ? "rotate-90" : ""}`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm font-bold text-indigo-700">
                              {n.ma_quan_ly || "Chưa gắn mã quản lý"}
                            </p>
                            {n.ten_quan_ly && <p className="truncate text-xs text-slate-500">{n.ten_quan_ly}</p>}
                          </div>
                          <span className="shrink-0 text-xs text-slate-400">{n.items.length} mã hàng</span>
                          <span className="shrink-0 text-xs text-slate-400">{n.soKhoa} khoa</span>
                        </button>
                        {moNhom && (
                          <div className="overflow-x-auto border-t border-slate-100 bg-slate-50/40">
                            <table className="w-full min-w-[820px] text-sm">
                              <thead className="text-left text-xs text-slate-500">
                                <tr>
                                  <th className="px-4 py-2 pl-11">Mã hàng</th>
                                  <th className="px-4 py-2">Tên vật tư</th>
                                  <th className="px-4 py-2 text-right">Tổng số lượng</th>
                                  <th className="px-4 py-2">Khoa đề xuất</th>
                                  <th className="w-10 px-3 py-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {n.items.map((r) => {
                                  const key = `${r.ma_hang}-${r.dvt}`;
                                  return (
                                    <Fragment key={key}>
                                      <tr className="border-t border-slate-100 bg-white align-top">
                                        <td className="px-4 py-3 pl-11 font-mono text-xs text-slate-600">{r.ma_hang}</td>
                                        <td className="max-w-md px-4 py-3 text-xs text-slate-700">{r.ten_vat_tu}</td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                                          {fmt(r.so_luong)} <span className="text-xs font-normal text-slate-400">{r.dvt}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                          {r.khoa_de_xuat.length} khoa
                                          <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-400">{r.khoa_de_xuat.join(", ")}</p>
                                        </td>
                                        <td className="px-3 py-3">
                                          <button type="button" onClick={() => setMoDong(moDong === key ? null : key)}
                                            className="text-slate-400 hover:text-teal-700" aria-label="Xem chi tiết theo khoa">
                                            <ChevronDown size={16} className={moDong === key ? "rotate-180" : ""} />
                                          </button>
                                        </td>
                                      </tr>
                                      {moDong === key && (
                                        <tr>
                                          <td colSpan={5} className="bg-slate-50 px-4 py-3">
                                        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                                          {r.dong_nguon.map((s) => (
                                            <div key={s.id} className="flex justify-between rounded-md bg-white px-2.5 py-1.5 text-xs">
                                              <span className="truncate text-slate-600">{s.don_vi}</span>
                                              <span className="ml-2 font-mono font-semibold text-slate-800">{fmt(s.so_luong)} {r.dvt}</span>
                                            </div>
                                          ))}
                                        </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  <span>Trang {trang}/{soTrang} · tối đa {NHOM_MOI_TRANG} mã quản lý/trang</span>
                  <div className="flex gap-1">
                    <button onClick={() => setTrang((p) => Math.max(1, p - 1))} disabled={trang === 1}
                      className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronLeft size={14} /></button>
                    <button onClick={() => setTrang((p) => Math.min(soTrang, p + 1))} disabled={trang === soTrang}
                      className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </>
            ) : (
              <p className="p-8 text-center text-sm text-slate-400">Không có mã hàng khớp bộ lọc.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {khoaHoSo && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-100 p-2 text-blue-700"><FolderPen size={17} /></span>
              <div>
                <p className="text-sm font-semibold text-blue-950">Hồ sơ do {khoaHoSo} gửi</p>
                <p className="text-xs text-blue-700">
                  Phòng Điều dưỡng được sửa trực tiếp, ghi chú và duyệt ngay trên cùng bản khoa đang xem.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setKhoaHoSo("")}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-blue-800 hover:bg-blue-50">
              <X size={13} /> Đóng hồ sơ khoa
            </button>
          </div>
          <HoSoTrucTuyen
            key={`${goi}-${dotId}-${khoaHoSo}-${nguonKeyHoSo}`}
            profile={profile}
            goi={goi}
            dotId={dotId}
            donVi={khoaHoSo}
            nguonKey={nguonKeyHoSo || "current"}
            rows={rowsKhoaDangMo}
            usage={usage}
            taiLieu={[
              { ma: "cam_ket_sl", ten: "Bản cam kết số lượng" },
              { ma: "danh_muc_dvsd", ten: "Danh mục đề xuất của khoa" },
            ]}
            meta={{
              don_vi: khoaHoSo,
              nguoi_lap: khoaHoSo,
            }}
            onSaved={lamMoiSauKhiLuuHoSoKhoa}
            tieuDe="PĐD kiểm tra và chỉnh hồ sơ của khoa"
            moTa="Mọi chỉnh sửa và trạng thái duyệt xuất hiện ngay ở tài khoản khoa; không cần gửi bản sửa qua Zalo."
          />
        </div>
      )}

      {canhBaoDvt.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {canhBaoDvt.length} mã quản lý có nhiều đơn vị tính
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Hệ thống không cộng chéo đơn vị tính; các dòng vẫn được tách theo mã hàng + ĐVT.
              </p>
              <p className="mt-2 text-xs text-amber-800">
                {canhBaoDvt.slice(0, 6).map((x) => `${x.ma}: ${x.dvts.join("/")}`).join(" · ")}
                {canhBaoDvt.length > 6 && ` · và ${canhBaoDvt.length - 6} mã khác`}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium text-amber-900">
                <input type="checkbox" checked={xacNhanDvt} onChange={(e) => setXacNhanDvt(e.target.checked)}
                  className="mt-0.5 accent-amber-700" />
                Tôi đã kiểm tra và xác nhận giữ các dòng khác ĐVT tách riêng trong phiên bản này.
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Chốt dữ liệu nguồn cho hồ sơ Phòng Điều dưỡng</h3>
            <p className="mt-1 text-xs text-slate-500">
              Chốt tạo snapshot bất biến. Hai tab Word/Excel trực tuyến bên dưới cùng khởi tạo từ snapshot này.
            </p>
          </div>
          <button type="button" onClick={chotPhien}
            disabled={!dotId || !tongHop.length || dangChot || chuaPatch || (canhBaoDvt.length > 0 && !xacNhanDvt)}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40">
            <FileCheck2 size={14} />
            {dangChot ? "Đang chốt…" : phien ? "Tạo phiên bản mới" : "Chốt bản tổng hợp"}
          </button>
        </div>

        {phien && (
          <div className={`mt-3 rounded-lg border p-3 ${phienConMoi ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-sm font-medium ${phienConMoi ? "text-teal-900" : "text-amber-900"}`}>
              Phiên bản #{phien.id} · {phien.so_khoa} khoa · {phien.so_dong} mã
            </p>
            <p className={`mt-0.5 text-xs ${phienConMoi ? "text-teal-700" : "text-amber-700"}`}>
              {new Date(phien.created_at).toLocaleString("vi-VN")} · {phien.created_by}
              {!phienConMoi && " · Dữ liệu đã duyệt hiện tại đã thay đổi; hãy tạo phiên bản mới nếu muốn cập nhật."}
            </p>
          </div>
        )}
      </div>

      {phien ? (
        <HoSoTrucTuyen
          key={`${goi}-${dotId}-pdd-${phien.id}`}
          profile={profile}
          goi={goi}
          dotId={dotId}
          donVi="Phòng Điều dưỡng"
          nguonKey={`phien:${phien.id}`}
          rows={phien.noi_dung?.rows || []}
          usage={phien.noi_dung?.usage || {}}
          taiLieu={[
            { ma: "de_nghi_mua", ten: "Phiếu đề nghị mua thầu" },
            { ma: "tong_hop_thau", ten: "Danh mục tổng hợp đi thầu" },
          ]}
          meta={{
            ...(phien.noi_dung?.meta || {}),
            don_vi: "Phòng Điều dưỡng",
            so_khoa: phien.so_khoa,
            phien_tong_hop_id: phien.id,
          }}
          onSaved={khoaPhienDaDiThauNeuHoanThanh}
          tieuDe="Tổng hợp hồ sơ Phòng Điều dưỡng"
          moTa={`Chỉnh trực tiếp trên bản Word và Excel từ snapshot #${phien.id}; duyệt & chốt trước khi tải bản chính thức. Bấm "Hoàn thành cả bộ" sẽ khóa các đề xuất nguồn trong đúng gói này — khoa không đề xuất trùng mã ở kỳ sau, gói khác không bị ảnh hưởng.`}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
          <FileCheck2 size={28} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">Chưa có bản tổng hợp để chỉnh</p>
          <p className="mt-1 text-xs text-slate-400">Chốt dữ liệu nguồn trước để tạo hai tab Word và Excel.</p>
        </div>
      )}
    </div>
  );
}
