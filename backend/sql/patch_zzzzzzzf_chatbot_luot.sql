-- patch_zzzzzzzf — 18/09/2026
--
-- SỔ LƯỢT BẤM CỦA CHATBOT TRỢ GIÚP
--
-- Chủ dự án chốt 18/09/2026: chatbot trợ giúp làm theo LUẬT (không AI), người
-- dùng BẤM CHỌN câu hỏi, và "lưu lại tất cả dữ liệu chat" để chủ dự án lấy về
-- đưa cho Claude cải thiện nội dung câu trả lời.
--
-- Một dòng = một lượt bấm. Chỉ GHI THÊM, không sửa, không xoá từ web.
--   * Ai cũng ghi được dòng CỦA MÌNH (email = người đang đăng nhập).
--   * Chỉ PĐD/admin đọc được — để xuất ra phân tích. Khoa không đọc được lượt
--     bấm của khoa khác.
--
-- Không chứa dữ liệu bệnh nhân. `trang_thai` là ảnh chụp trạng thái tiến trình
-- lúc bấm (đã gửi chưa, đã xác nhận chưa…) để biết câu trả lời nào đã hiện.
-- Dung lượng ước tính: vài trăm byte/dòng — không đáng kể so với 500 MB.

create table if not exists chatbot_luot (
    id               bigserial primary key,
    created_at       timestamptz not null default now(),
    email            text        not null default auth.email(),
    vai_tro          text,
    khoa             text,
    phien            text,          -- mã ngẫu nhiên cho một lần mở khung chat
    loai             text        not null
        check (loai in ('mo', 'chon', 'di_toi', 'dong', 'huu_ich', 'chua_huu_ich')),
    nut_id           text,          -- id nút trong bộ câu hỏi
    bien_the         text,          -- biến thể theo trạng thái đã hiện (nếu có)
    man              text,          -- màn đang mở lúc bấm
    trang_thai       jsonb,
    phien_ban_noi_dung int
);

create index if not exists chatbot_luot_thoi_gian_idx on chatbot_luot (created_at desc);
create index if not exists chatbot_luot_nut_idx on chatbot_luot (nut_id);

comment on table chatbot_luot is
    'Lượt bấm của chatbot trợ giúp theo luật (QĐ 18/09/2026). Chỉ ghi thêm; PĐD đọc để cải thiện nội dung.';

alter table chatbot_luot enable row level security;

drop policy if exists "ghi luot chatbot cua minh" on chatbot_luot;
create policy "ghi luot chatbot cua minh" on chatbot_luot
    for insert to authenticated
    with check (email = (select auth.email()));

drop policy if exists "pdd doc luot chatbot" on chatbot_luot;
create policy "pdd doc luot chatbot" on chatbot_luot
    for select to authenticated
    using ((select current_user_role()) in ('dieu_duong', 'admin'));

-- Không có policy UPDATE/DELETE: sổ chỉ ghi thêm.
grant insert on chatbot_luot to authenticated;
grant select on chatbot_luot to authenticated;
grant usage, select on sequence chatbot_luot_id_seq to authenticated;
