# AGENTS.md

Hướng dẫn cho người và cho agent khi làm việc trong repo này.

## Đọc gì trước khi chạm vào code

**Toàn bộ tài liệu dự án nằm trong `Hướng dẫn build project/`.** Bắt đầu từ
`Hướng dẫn build project/00_DOC_TRUOC_TIEN.md` — file đó là bản đồ.

> 🔴 **Hai lần đổi hướng gần nhất:** bản **MỘT MẶT BÀN** (21/08/2026) — mọi thao
> tác sửa của PĐD dồn về Danh mục tổng hợp; và bản **VÒNG KHÉP KÍN** (23/08/2026,
> **đã thi công xong**) — rớt → đổ sang mã tương đương → cuốn chiếu về đợt bổ
> sung → hộp thư hai chiều. Tài liệu, docx và sơ đồ đều đã đồng bộ tới 23/08.
>
> ☠️ **Ba bảng ĐÃ CHẾT, đừng dựng lại:** `goi_thau_ket_qua_ma` ·
> `goi_thau_tien_do` · `goi_thau_moc` (mô hình trước v3). Màn đọc chúng **hiện
> rỗng mà không báo lỗi** — đó là lớp lỗi khó thấy nhất của dự án này. Nghi ngờ
> thì chạy `backend/scripts/kiem_moi_man.py --xac-nhan-staging`.

Tối thiểu phải đọc trước khi sửa bất cứ thứ gì:

| Việc bạn định làm | Đọc |
|---|---|
| Sửa tính năng nghiệp vụ | `01_NGHIEP_VU_HIEN_HANH.md` → `06_DUNG_LAM_LAI.md` |
| Chạy patch SQL, deploy, đụng staging | `04_VAN_HANH_KY_THUAT.md` (mục bẫy là phần quan trọng nhất) |
| Đụng công thức số lượng | `02_CONG_THUC_SO_LUONG.md` — và **đừng đụng trước Phase G** |
| Không hiểu vì sao code làm thế | `07_NHAT_KY_THAY_DOI.md` |

## Bốn điều dễ làm sai nhất

1. **Đừng dựng lại thứ đã bị bỏ.** Dự án đã đảo luật **29 lần**. Trước khi thêm một
   bước duyệt, một cổng chặn, một cơ chế khoá ô — mở `06_DUNG_LAM_LAI.md` xem
   nó có nằm trong danh sách đã bỏ không.
2. **Repo SQL không phải nguồn chuẩn của schema.** 55 patch chồng nhau, có
   function được định nghĩa lại 7 lần. Mọi kết luận "code đã xử lý việc này"
   phải kiểm trên database thật.
3. **Chỉ có ba khoá cứng toán học.** Ngoài chúng và hai cổng đã chốt, hệ cảnh
   báo chứ không chặn. Đừng tự thêm cổng chặn quy trình. Lưu ý khoá 2 và khoá 3
   **chặn ở hai thời điểm khác nhau** kể từ 21/08/2026 — xem `01` mục 0.
4. **PĐD chỉ có một mặt bàn.** Mọi thao tác sửa của PĐD đi qua Danh mục tổng
   hợp. Thấy thao tác nào chật chội trên grid thì làm grid rộng ra, **đừng tách
   màn mới** (QĐ 21/08/2026).

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
