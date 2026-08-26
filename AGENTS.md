# AGENTS.md

Hướng dẫn cho người và cho agent khi làm việc trong repo này.

## 📍 BẮT ĐẦU SESSION MỚI — TÌNH HÌNH TỚI CUỐI 26/08/2026

Chủ dự án đã tự chạy hết vòng và báo **"tôi test ổn"**. Không có lỗi nào đang mở.

```
commit  702d039   ·  bundle index-BzCD7WGD.js  ·  Netlify = localhost
pytest  240 xanh  ·  build ✓  ·  Chrome hai màn 0 lỗi console
staging 136/500 MB · đợt #200 (18 tháng) + #201 (bổ sung T9/2026, hệ tự tạo)
```

**Vòng đã đo được hết, trên dữ liệu thật của chủ dự án:**

```
khoa gửi đề xuất → xác nhận lần 1 → PĐD tổng hợp → chốt Q → ba giai đoạn thầu
→ ghi rớt → chia số trúng → đổ mã tương đương → xác nhận rớt → mã rớt VÀO GIỎ
```

**Sáu việc còn lại trước khi mở cho 62 khoa** — chi tiết ở
`05_TRANG_THAI_VA_VIEC_TIEP_THEO.md` mục 7:

1. Chạy `backend/sql/patch_zzzzzz_go_tay_xoa_du_lieu.sql` — **viết sẵn, CHỜ
   LỆNH**. Chủ dự án muốn giữ nút xoá trong lúc còn test và sẽ báo thời điểm gỡ.
2. Nạp HIS **T7 + T8/2026** (đang mới tới T6).
3. Dọn dữ liệu test, mở đợt thật cho gói 18 tháng 2027-2028.
4. 62 khoa đăng ký → PĐD gán khoa ở màn `QuanLyNguoiDung` (đã có sẵn).
5. Luật cắt cho `usage_history_changelog` (48 MB, chưa có luật nào).
6. **Giảm số cú bấm** trên đường khoa gõ đề xuất — việc code duy nhất đáng làm.
   Bắt đầu bằng ĐO, không đoán.

⚠️ **Không tự ý chạy việc 1.** Chủ dự án đã nói rõ sẽ báo khi nào gỡ.

---

## 🔴🔴 GO-LIVE GIỮA T9/2026 — ĐỌC TRƯỚC MỌI THỨ

Không phải 01/01/2027. Việc thật đầu tiên: **62 khoa gõ đề xuất cho gói 18
tháng 2027-2028**, ngày 08–20/09/2026.

**Chỉ nửa đầu pipeline nằm trên đường tới mốc này** — khoa đề xuất → giỏ → gửi
→ xác nhận danh mục → PĐD tổng hợp → chốt Q → chốt trình ký. Nửa sau (thầu →
rớt → đổ mã → hợp đồng → giao hàng → cam kết 20/50/80 → 30%) phải mở thầu xong
mới chạm tới, sớm nhất cuối 2026.

🔴 **CHỈ ĐẠO NỀN CỦA CHỦ DỰ ÁN — áp cho mọi việc từ giờ:**

> *"đừng phát sinh thêm nhiều function nữa (làm đơn giản tối ưu click)"*

Không thêm tính năng, không thêm màn. Việc code đáng làm nhất là **giảm số cú
bấm** trên đường khoa gõ đề xuất — nó nhân với 62 khoa × hàng trăm mã.

⚠️ **Staging CHÍNH LÀ production.** Không có project Supabase thứ ba. Mọi thứ
"chỉ bật trên staging" sẽ bật trên hệ thống thật của 62 khoa.

---

## 🔴 ĐẨY LÊN NETLIFY — TÀI KHOẢN ĐÃ HẾT CREDITS

Hết credits thì Netlify **nhận commit nhưng bỏ qua không build**, site cứ phục
vụ bản cũ và **không báo gì cho ai**. Ngày 26/08 site đứng sau HEAD 8 commit,
chủ dự án test và gặp lỗi đã vá từ lâu.

`netlify deploy --prod` trả `Forbidden`. Đường chạy được (không tốn credits vì
mình tự build ở máy, Netlify chỉ nhận file):

```bash
cd frontend && npm run build && cd ..
netlify deploy --dir=frontend/dist          # in ra Draft URL kèm deploy id
netlify api restoreSiteDeploy \
  --data '{"site_id":"883aef7e-fc50-4b29-bc27-2d97557f353e","deploy_id":"<id>"}'
curl -s https://vtyt-umc-test.netlify.app/ | grep -o 'index-[A-Za-z0-9_-]*\.js'
```

`netlify login` mở trình duyệt nên **phải người thật bấm** — bảo chủ dự án gõ
`!netlify login`. Tài khoản `tranthanhan1626@gmail.com`, team Free.

Muốn biết vì sao Netlify không build: **đọc `error_message` của đúng deploy
hỏng**, đừng đoán từ `capabilities.credits` (chỉ số đó nói chuyện khác):

```bash
netlify api listSiteDeploys --data '{"site_id":"<id>","per_page":3}'
```

---

## 🔴 QUY TẮC BẤT DI BẤT DỊCH — CHẠY WEB ĐỂ TEST

**Mọi vòng test chạy ở LOCALHOST. Không dùng Netlify** (QĐ chủ dự án
25/08/2026 — tài khoản miễn phí đã hết credits build của tháng, push KHÔNG làm
site đổi theo).

```bash
cd frontend && npm run build && npm run preview
# → http://localhost:4173
# đăng nhập PĐD:  pdd@umc.edu.vn / 111111
# đăng nhập khoa: dvsd1@umc.edu.vn / 111111
```

**Ba điều bắt buộc:**

1. **Đo trên `preview`, KHÔNG đo trên `npm run dev`.** Bản dev bật
   `React.StrictMode` nên gọi **mọi truy vấn hai lần** — 48 lượt REST so với 25
   của bản thật. Mọi con số đo ở `dev` bị thổi lên gấp đôi.
2. **Build lại trước mỗi lần đo.** `preview` phục vụ thư mục `dist/` đã build,
   không tự cập nhật theo mã nguồn.
3. **Tải lại trang bỏ qua bộ nhớ đệm** sau khi build, nếu không trình duyệt giữ
   bundle cũ và bạn sẽ kết luận sai về thay đổi của chính mình (đã mắc 25/08).
   Kiểm nhanh: `[...document.querySelectorAll('script[src]')].map(s=>s.src)`
   phải trùng tên với `ls frontend/dist/assets/index-*.js`.

**Database không liên quan Netlify** — patch chạy thẳng lên staging bằng
`backend/scripts/chay_patch.py`, nên phần nghiệp vụ luôn là bản mới nhất kể cả
khi site đứng yên.

---

## 🔴 QUY TẮC — XÂY XONG MỘT TÍNH NĂNG LÀ PHẢI CÓ NGƯỜI KHÁC BẤM THỬ

> ⚠️ **26/08/2026 — TÔI ĐÃ VI PHẠM QUY TẮC NÀY VÀ TRẢ GIÁ NGAY.**
> Đổi nguồn dữ liệu của hai màn (`phan_bo_khoa` → `v_phan_bo_sau_dieu_chuyen_v3`),
> chạy `build ✓` + 238 test văn bản rồi giao thẳng. Chủ dự án mở màn là **chết
> ngay**: `column v_phan_bo_sau_dieu_chuyen_v3.id does not exist` — view gộp
> không có cột `id` mà `fetchAllRows` vẫn phân trang bằng `order: "id"`.
>
> Vá xong tôi mới chịu bấm Chrome, và **bắt thêm lỗi thứ hai** mà không cách nào
> khác thấy được: `row` trong `taiDuLieuKhoa` dựng **từng field một**, không
> spread `prop` — nên chọn cột trong `.select()` thôi là chưa đủ, bốn trường
> điều chuyển không bao giờ tới chỗ vẽ và nhãn "↪ đã đổ … sang …" **không hiện**.
> Không lỗi, không cảnh báo, chỉ lặng lẽ thiếu.
>
> **Hai lỗi, cùng một tính năng, cùng một lần bỏ qua việc bấm thử.**
> `build ✓` và `pytest` xanh **không** chứng minh màn hình chạy.

Chủ dự án chốt 26/08/2026: **mỗi lần build xong một tính năng, giao cho một
agent ĐỘC LẬP bấm thử tính năng đó trên trình duyệt như người dùng thật** (Chrome
qua `mcp__chrome-devtools__*`), tổng hợp lỗi rồi báo về để người xây vá.

Vì sao thành quy tắc: dự án đã dính lớp lỗi "màn chết mà không ai biết"
**bốn lần** trong ba ngày — ba bảng chết 23/08, component quên import 24/08,
view rớt cột 24/08, chốt trình ký mất đường bấm 24/08. Cả bốn đều lọt qua
`pytest`, `build ✓` và cả smoke. **Chỉ có bấm thật mới bắt được.**

Giao việc cho agent kiểm phải nói rõ: bấm gì · kỳ vọng thấy gì · dữ liệu nào
được phép làm bẩn · **không commit, không push**. Người xây rà lại từng bản vá
rồi mới commit.

---

## Đọc gì trước khi chạm vào code

**Toàn bộ tài liệu dự án nằm trong `Hướng dẫn build project/`.** Bắt đầu từ
`Hướng dẫn build project/00_DOC_TRUOC_TIEN.md` — file đó là bản đồ.

> 🔴 **Hai lần đổi hướng gần nhất:** bản **MỘT MẶT BÀN** (21/08/2026) — mọi thao
> tác sửa của PĐD dồn về Danh mục tổng hợp; và bản **VÒNG KHÉP KÍN** (23/08/2026,
> **đã thi công xong**) — rớt → đổ sang mã tương đương → chuyển tiếp về đợt bổ
> sung → hộp thư hai chiều. Tài liệu, docx và sơ đồ đều đã đồng bộ tới 23/08.
>
> **24/08/2026 — D11–D15.** Thứ tự thao tác sau khi có kết quả thầu, hệ chặn
> nếu làm sai: gõ số rớt → **CHIA số trúng về khoa** → đổ sang mã tương đương →
> mã nhận về trống, **CHIA LẠI** trên tổng mới → Xác nhận rớt.
> Số phải chia = **trúng + phần nhận**. "Cuốn chiếu" nay gọi là **"chuyển tiếp"**.
>
> ☠️ **Ba bảng ĐÃ CHẾT, đừng dựng lại:** `goi_thau_ket_qua_ma` ·
> `goi_thau_tien_do` · `goi_thau_moc` (mô hình trước v3). Màn đọc chúng **hiện
> rỗng mà không báo lỗi** — đó là lớp lỗi khó thấy nhất của dự án này. Nghi ngờ
> thì chạy `backend/scripts/kiem_moi_man.py --xac-nhan-staging`.
>
> 🔴 **25/08/2026 — quy mô thật làm lộ bảy lỗi hệ thống.** Bộ dữ liệu
> ~1.586 mã × 50 khoa (`scripts/tao_du_lieu_test_quy_mo_that.py`) tìm ra thứ mà
> 208 test và 29 bước smoke đều không thấy. Hai luật rút ra:
> **(1)** mọi policy RLS phải bọc lời gọi hàm trong `(select ham())`, nếu không
> nó chạy lại cho từng dòng; **(2)** bảng có cột `khoa` thì đừng chép khuôn
> `using (auth.role() = 'authenticated')` — khoa sẽ đọc được dòng của mọi khoa.
> `kiem_moi_man.py` nay canh cả hai.
>
> 🔴 **24/08/2026 — lớp lỗi đó tái diễn hai lần trong một ngày.** Viết lại một
> view mà rớt cột (`v_ket_qua_thau_theo_khoa` mất `da_xu_ly` · `ket_qua_id` ·
> `dot_id`) làm vỡ hẳn ba màn; và một component dùng mà quên import làm trắng
> màn Tổng hợp. **`build ✓` và `pytest` xanh KHÔNG chứng minh màn hình chạy.**
> Chạy `kiem_moi_man.py` sau **mỗi** lần viết lại view — nay nó dò đúng từng cột
> các màn xin, không còn dò `select("*")` — và bấm thật một lượt trên đường mà
> thay đổi đi qua.

Tối thiểu phải đọc trước khi sửa bất cứ thứ gì:

| Việc bạn định làm | Đọc |
|---|---|
| Sửa tính năng nghiệp vụ | `01_NGHIEP_VU_HIEN_HANH.md` → `06_DUNG_LAM_LAI.md` |
| Chạy patch SQL, deploy, đụng staging | `04_VAN_HANH_KY_THUAT.md` (mục bẫy là phần quan trọng nhất) |
| Đụng công thức số lượng | `02_CONG_THUC_SO_LUONG.md` — và **đừng đụng trước Phase G** |
| Không hiểu vì sao code làm thế | `07_NHAT_KY_THAY_DOI.md` |

## Bảy điều dễ làm sai nhất

1. **Đừng dựng lại thứ đã bị bỏ.** Dự án đã đảo luật **29 lần**. Trước khi thêm một
   bước duyệt, một cổng chặn, một cơ chế khoá ô — mở `06_DUNG_LAM_LAI.md` xem
   nó có nằm trong danh sách đã bỏ không.
2. **Repo SQL không phải nguồn chuẩn của schema.** 55 patch chồng nhau, có
   function được định nghĩa lại 7 lần. Mọi kết luận "code đã xử lý việc này"
   phải kiểm trên database thật.
3. **Chỉ có ba khoá cứng toán học.** Ngoài chúng và hai cổng đã chốt, hệ cảnh
   báo chứ không chặn. Đừng tự thêm cổng chặn quy trình. Lưu ý khoá 2 và khoá 3
   **chặn ở hai thời điểm khác nhau** kể từ 21/08/2026 — xem `01` mục 0.
4. **Đừng tin `build ✓` là màn hình chạy.** Một component dùng mà quên import
   làm trắng cả màn mà build vẫn qua; một view rớt cột làm ba màn chết mà
   `pytest` vẫn xanh. Phải **bấm thật** trên `localhost:4173` ít nhất một lượt
   trên đường mà thay đổi đi qua.
5. **PĐD chỉ có một mặt bàn.** Mọi thao tác sửa của PĐD đi qua Danh mục tổng
   hợp. Thấy thao tác nào chật chội trên grid thì làm grid rộng ra, **đừng tách
   màn mới** (QĐ 21/08/2026).
6. **Đọc `pg_trigger` của bảng TRƯỚC khi hỏi chủ dự án chọn cách ghi.** Ngày
   26/08 tôi đưa phương án "ghi đè `phan_bo_khoa`", chủ dự án chọn, thi công
   xong mới lộ ra bảng đó bị **khoá cứng 1** chặn sau chốt Q — phương án không
   bao giờ đi được, và để nguyên thì **hỏng hẳn chức năng đổ mã**.
   ```sql
   select t.tgname, p.proname, pg_get_triggerdef(t.oid) from pg_trigger t
   join pg_proc p on p.oid = t.tgfoid
   where t.tgrelid = '<bảng>'::regclass and not t.tgisinternal;
   ```
7. **Đổi chỗ VẼ thì soi lại `.select()` nuôi nó.** Thiếu một cột là sai lặng lẽ,
   không lỗi không cảnh báo: `Number(undefined) > 0` luôn false, `fmt(undefined)`
   ra chuỗi `"NaN"` hiện thẳng ra màn. `build ✓` và pytest đều không bắt được.

## Ranh giới an toàn

- Test trên **staging** trước. Không chạy patch hay dọn dữ liệu trên production
  khi chưa xem trước phạm vi.
- Không đưa service-role key, dữ liệu bệnh viện hay file backup lên Git.
- Không tự đặt ngưỡng thời gian hay chỉ số nào chủ dự án chưa duyệt (QĐ-18).
- Bí mật nằm ở `backend/.env.local` và `ghi-chu-key/` — cả hai đã gitignore,
  **không bao giờ** sao chép sang `frontend/`.

## Ghi chú thi công

Ghi chú và kế hoạch của từng phiên làm việc sống trong `.scratch/<tên-việc>/`.
Đó là **nháp**, không phải tài liệu dự án — đừng lấy quyết định từ đó. Quyết
định chính thức chỉ nằm trong `Hướng dẫn build project/`.

## Cấu hình công cụ

`docs/agents/` là quy ước mặc định của bộ công cụ (issue tracker dạng markdown
trong `.scratch/`, nhãn triage, cách đọc domain docs). **Không phải tài liệu
nghiệp vụ** — để nguyên, đừng lấy quyết định dự án từ đó.

Lưu ý: `docs/agents/domain.md` bảo tìm `CONTEXT.md` và `docs/adr/` ở gốc repo.
**Repo này không có hai thứ đó** và cũng không cần — vai trò của chúng do
`Hướng dẫn build project/` đảm nhiệm.
