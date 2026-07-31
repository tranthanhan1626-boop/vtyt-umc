import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Clock, Plus, Trash2 } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import {
  doDaiKy,
  FormNhomKyThuat,
  FORM_NHOM_TRONG,
  MAU_TT_NHOM,
  NHAN_TT_NHOM,
} from "./Function1";

export default function NhomKyThuatCuaKhoa({ profile }) {
  const chonDuocDonVi = profile.role === "admin" || profile.role === "dieu_duong";
  const [donVi, setDonVi] = useState(profile.khoa || "");
  const [dsDonVi, setDsDonVi] = useState([]);
  const [dsNhom, setDsNhom] = useState([]);
  const [dsDeNghi, setDsDeNghi] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [moForm, setMoForm] = useState(false);
  const [form, setForm] = useState(FORM_NHOM_TRONG);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [daGui, setDaGui] = useState(false);

  const taiDanhMuc = useCallback(async () => {
    const { data, error } = await fetchAllRows((f, t) =>
      supabase.from("v_nhom_co_ma_hang")
        .select("ma_quan_ly, ten_quan_ly, so_ma_hang")
        .order("ma_quan_ly")
        .range(f, t)
    );
    if (!error) setDsNhom(data || []);
  }, []);

  const taiDeNghi = useCallback(async (khoa) => {
    if (!khoa) return;
    setDangTai(true);
    const { data, error } = await supabase.from("khoa_nhom_ky_thuat")
      .select("*")
      .eq("don_vi", khoa)
      .order("created_at", { ascending: false });
    if (error) setLoi(error.message);
    else {
      setDsDeNghi(data || []);
      setLoi("");
    }
    setDangTai(false);
  }, []);

  useEffect(() => { taiDanhMuc(); }, [taiDanhMuc]);
  useEffect(() => { taiDeNghi(donVi); }, [donVi, taiDeNghi]);

  useEffect(() => {
    if (!chonDuocDonVi) return;
    supabase.from("v_don_vi").select("don_vi").order("don_vi").then(({ data }) => {
      setDsDonVi((data || []).map((d) => d.don_vi));
    });
  }, [chonDuocDonVi]);

  const dem = useMemo(() => ({
    tong: dsDeNghi.length,
    cho: dsDeNghi.filter((d) => d.trang_thai === "cho_duyet").length,
    duyet: dsDeNghi.filter((d) => d.trang_thai === "da_duyet").length,
  }), [dsDeNghi]);

  const gui = async () => {
    const f = form;
    setLoi("");
    setDaGui(false);
    const batBuoc = [
      [f.ten_vat_tu_moi, "tên vật tư"], [f.ten_thuong_mai, "tên thương mại"],
      [f.tieu_chi_ky_thuat, "tiêu chí kỹ thuật"], [f.ky_ma_hieu, "ký mã hiệu"],
      [f.hang, "hãng"], [f.nuoc_san_xuat, "nước sản xuất"], [f.goi, "gói thầu"],
    ].filter(([v]) => !String(v).trim()).map(([, ten]) => ten);
    if (batBuoc.length) { setLoi(`Thiếu: ${batBuoc.join(", ")}.`); return; }
    if (!(Number(f.so_luong) > 0)) { setLoi("Số lượng đề xuất phải > 0."); return; }
    if (doDaiKy(f) < 1) { setLoi("Mốc kết thúc phải sau mốc bắt đầu."); return; }
    const laGop = f.che_do === "gop";
    if (laGop && !f.ma_quan_ly.trim()) {
      setLoi("Chưa chọn mã quản lý để gộp vào. Nếu vật tư chưa từng có, chuyển sang “Mã mới hoàn toàn”.");
      return;
    }

    setDangGui(true);
    const { error } = await supabase.from("khoa_nhom_ky_thuat").insert({
      don_vi: donVi,
      ma_quan_ly: f.ma_quan_ly.trim() || null,
      la_nhom_moi: !laGop,
      ten_quan_ly_moi: f.ten_quan_ly_moi.trim() || null,
      ma_hang_moi: f.ma_hang_moi.trim() || null,
      ten_vat_tu_moi: f.ten_vat_tu_moi.trim(),
      dvt_moi: f.dvt_moi.trim() || null,
      ten_thuong_mai: f.ten_thuong_mai.trim(),
      tieu_chi_ky_thuat: f.tieu_chi_ky_thuat.trim(),
      ky_ma_hieu: f.ky_ma_hieu.trim(),
      hang: f.hang.trim(),
      nuoc_san_xuat: f.nuoc_san_xuat.trim(),
      goi: f.goi,
      so_luong: Math.round(Number(f.so_luong)),
      tu_thang: Number(f.tuThang), tu_nam: Number(f.tuNam),
      den_thang: Number(f.denThang), den_nam: Number(f.denNam),
      ghi_chu: f.ghi_chu.trim() || null,
      created_by: profile.email,
      created_by_ho_ten: profile.ho_ten,
    });
    setDangGui(false);
    if (error) {
      setLoi(error.code === "23505" ? "Khoa đã đề nghị mã này rồi." : error.message);
      return;
    }
    setForm(FORM_NHOM_TRONG);
    setMoForm(false);
    setDaGui(true);
    await Promise.all([taiDanhMuc(), taiDeNghi(donVi)]);
  };

  const xoa = async (id) => {
    const { error, count } = await supabase
      .from("khoa_nhom_ky_thuat").delete({ count: "exact" }).eq("id", id);
    if (error) { setLoi(error.message); return; }
    if (!count) { setLoi("Không xoá được (thiếu quyền hoặc đề nghị đã được duyệt)."); return; }
    await taiDeNghi(donVi);
  };

  return (
    <div className="space-y-5">
      <section className="umc-page-heading">
        <div>
          <p className="umc-eyebrow">Danh mục kỹ thuật của khoa</p>
          <h1>Mã kỹ thuật khoa tự thêm</h1>
          <p>
            Khai vật tư tương đương để gộp vào mã quản lý có sẵn, hoặc đề nghị
            một mã mới hoàn toàn để Phòng Điều dưỡng duyệt.
          </p>
        </div>
        <button type="button" onClick={() => { setMoForm(true); setLoi(""); }}
          className="umc-page-primary">
          <Plus size={17} /> Thêm mã kỹ thuật
        </button>
      </section>

      <div className="umc-data-summary">
        <div><strong>{dem.tong}</strong><span>Tổng đề nghị</span></div>
        <div><strong>{dem.cho}</strong><span>Chờ duyệt</span></div>
        <div><strong>{dem.duyet}</strong><span>Đã duyệt</span></div>
      </div>

      {chonDuocDonVi && (
        <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Khoa / đơn vị</label>
          <div className="relative">
            <select value={donVi} onChange={(e) => setDonVi(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 pr-9 text-sm">
              {!dsDonVi.includes(donVi) && <option value={donVi}>{donVi}</option>}
              {dsDonVi.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      )}

      {daGui && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={17} /> Đã gửi đề nghị tới Phòng Điều dưỡng.
        </div>
      )}

      {moForm && (
        <FormNhomKyThuat
          giaTri={form}
          doiGiaTri={setForm}
          onLuu={gui}
          onHuy={() => { setMoForm(false); setForm(FORM_NHOM_TRONG); setLoi(""); }}
          dangLuu={dangGui}
          loi={loi}
          dsNhom={dsNhom}
        />
      )}

      {loi && !moForm && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Danh sách đề nghị của {donVi}</h2>
          <p className="mt-1 text-xs text-slate-500">Mới nhất xếp trước · dữ liệu hiển thị đầy đủ theo quyền tài khoản</p>
        </div>

        {dangTai ? (
          <p className="p-8 text-center text-sm text-slate-400">Đang tải danh sách…</p>
        ) : dsDeNghi.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">Khoa chưa có đề nghị mã kỹ thuật nào.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {dsDeNghi.map((d) => (
              <article key={d.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,.8fr)_auto]">
                <div className="min-w-0">
                  <div className="font-mono text-base font-bold tracking-wide text-blue-700">
                    {d.ma_quan_ly || d.ma_hang_moi || "MÃ MỚI"}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                    {d.ten_vat_tu_moi || d.ten_quan_ly_moi}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {d.ten_thuong_mai && `${d.ten_thuong_mai} · `}
                    {d.hang}{d.nuoc_san_xuat ? `, ${d.nuoc_san_xuat}` : ""}
                  </p>
                </div>
                <div className="text-xs leading-5 text-slate-500">
                  <p><b className="text-slate-700">Số lượng:</b> {d.so_luong || "—"} {d.dvt_moi || ""}</p>
                  <p><b className="text-slate-700">Gói:</b> {d.goi || "—"}</p>
                  {d.ly_do_tu_choi && <p className="text-red-600">Lý do: {d.ly_do_tu_choi}</p>}
                </div>
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${MAU_TT_NHOM[d.trang_thai]}`}>
                    {NHAN_TT_NHOM[d.trang_thai]}
                  </span>
                  {d.trang_thai === "cho_duyet" && (
                    <button type="button" onClick={() => xoa(d.id)} title="Rút đề nghị"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {d.trang_thai === "cho_duyet" && (
                  <p className="flex items-center gap-1 text-xs text-slate-400 md:col-span-3">
                    <Clock size={12} /> Chờ Phòng Điều dưỡng duyệt
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
