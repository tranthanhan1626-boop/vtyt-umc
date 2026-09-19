# Kiểm sau patch_zzzzzzzh (is_current theo đợt)

Số "trước" đo trên DB lúc 18/09/2026 bằng phiên READ ONLY. Mọi câu SELECT dưới đây chạy được qua `run.sh` (các câu cách nhau `;;`).

## 0. Chạy patch (chủ dự án gõ)

```
! cd /Users/tranhien/Downloads/9.vtyt/backend && set -a && . ./.env.local && set +a && .venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzh_is_current_theo_dot.sql
```

Nếu patch báo lỗi thì cả file đã rollback, DB không đổi gì. Đọc câu `raise exception` để biết vì sao dừng.

## 1. Đo trên DB — trước / sau

| # | Câu SELECT | Trước | Sau (kỳ vọng) |
|---|---|---|---|
| 1 | `select indexname from pg_indexes where tablename='proposals' and indexname like 'one_current%' order by 1` | `one_current_proposal`, `one_current_proposal_dot_goi` | `one_current_proposal_dot_goi`, `one_current_proposal_theo_dot` |
| 2 | `select pg_get_indexdef('one_current_proposal_theo_dot'::regclass)` | (lỗi: chưa có) | `... (ma_hang, don_vi, dot_id) WHERE is_current` |
| 3 | `select id, is_current from proposals where id in (327620,327625,327630,327631) order by id` | F, F, T, T | T, T, T, T |
| 4 | `select dot_id, count(*) filter (where is_current) from proposals group by 1 order by 1` | 200→22, 201→2 | 200→24, 201→2 |
| 5 | `select count(*) from (select 1 from proposals where is_current group by ma_hang,don_vi,dot_id having count(*)>1) x` | 0 | 0 |
| 6 | `select count(*) from (select 1 from proposals where is_current group by ma_hang,don_vi,nam_de_xuat having count(*)>1) x` | 0 | **2** (GMHS 66509, 67260: #200 + #201) — đúng ý, không phải lỗi |
| 7 | `select id, proposal_id, so_luong_hien_hanh, revision from phan_bo_khoa where id in (327501,327506)` | 327620/250/1 · 327625/15000/1 | **y hệt** (patch không đụng phan_bo_khoa) |
| 8 | `select tgenabled from pg_trigger where tgname='trg_khoi_tao_phan_bo_khoa'` | O | O (trigger đã bật lại) |
| 9 | `select prosrc ~ 'dot_id is not distinct from v_dot_id' from pg_proc where proname='submit_proposal_group'` | f | t |
| 10 | `select prosrc ~ 'app.submit_dot_id' from pg_proc where proname='submit_proposal_group_v2'` | f | t |
| 11 | `select count(*) from v_de_xuat_tong_hop where dot_id=200 and don_vi='Khoa GMHS - Phòng mổ'` | 10 | 12 |

## 2. Gửi thử trên web (tài khoản test)

Dùng **dvsd2@umc.edu.vn (Khoa PT hàm mặt – RHM)**. Khoa này có mã **67333** hiện hành ở đợt #200 (id 327614) và chưa có gì ở đợt #201. DOT_GOI 831 (#201) đang mở, RHM có tham gia, chưa chốt.

1. Đăng nhập dvsd2, chọn **đợt #201 – Mua sắm bổ sung T9/2026**. Đọc dòng chữ tím "… mã quản lý đang nằm trong giỏ/hồ sơ nên tạm ẩn" (trước khi gửi: 0).
2. Thêm 67333 vào giỏ (số nhỏ, ví dụ 10) → Gửi.
3. Đo:
   ```sql
   select id, dot_id, version, is_current from proposals
   where ma_hang='67333' and don_vi='Khoa Phẫu thuật hàm mặt răng hàm mặt' order by version
   ```
   Kỳ vọng: 327614 (#200, v1) **vẫn T**, và có thêm dòng mới (#201, v2) **T**.
   Nếu chưa vá thì 327614 sẽ thành F. Đây là phép thử chính.
4. Gửi lại 67333 ở **cùng đợt #201** (số khác, ví dụ 12). Kỳ vọng: dòng v2 → F, dòng v3 (#201) → T, 327614 vẫn T. Phép thử này cho thấy "bản cũ trong cùng đợt" vẫn được tắt như trước.
5. Dọn dữ liệu: rút hoặc xoá hai giỏ thử bằng màn Quản lý dữ liệu test (`xoa_de_xuat_kiem_thu_v3`). Sau đó chạy lại câu ở bước 3 để chắc 327614 vẫn T.

Không thử gửi ở đợt #200: DOT_GOI 826 đã chốt Q (chot_q_phien 215), trigger gác sẽ chặn. Chặn ở đây là đúng, không phải lỗi của patch.

## 3. Kỳ vọng trên màn hình

| Màn | Tài khoản | Trước patch | Sau patch |
|---|---|---|---|
| **Bàn điều hành PĐD**, đợt #200, gói Dùng chung | pdd@ | GMHS thiếu 66509, 67260 | GMHS **hiện lại 2 dòng**: 66509 = 250, 67260 = 15000 (số lấy từ phan_bo_khoa 327501/327506). Tổng dòng đợt 200: 22 → 24 |
| Bàn điều hành, đợt #201 | pdd@ | GMHS 66509, 67260 | Không đổi |
| **Đề xuất của tôi**, tab 18 tháng | dvsd1@ (GMHS) | Giỏ 26/08 (nhóm 5a79a969…) có 10 mã | Giỏ đó có đủ **12 mã** |
| Đề xuất của tôi, tab Bổ sung | dvsd1@ | Giỏ 18/09 có 2 mã | Không đổi |
| **Mã tạm ẩn**, màn đề xuất đợt #200 | dvsd1@ | 10 mã hàng / 5 mã quản lý | **12 mã hàng / 7 mã quản lý** (thêm K26.04.000.01, K26.35.000.01) |
| Mã tạm ẩn, đợt #201 | dvsd1@ | 2 / 2 | Không đổi |
| **Cảnh báo mã trùng đợt** (khung xanh) khi đứng ở #201, chọn nhóm K26.04.000.01 | dvsd1@ | Không hiện (dòng #200 đã tắt) | Hiện "đang có ở 1 đợt khác: Gói rộng rãi 1/2027 - 6/2028" |

Mở màn bằng Chrome (tải lại bỏ cache) rồi mới báo xong: build ✓ không chứng minh màn đúng (AGENTS.md điều 4).

## 4. Nếu phải gỡ

```
! cd /Users/tranhien/Downloads/9.vtyt/backend && set -a && . ./.env.local && set +a && .venv/bin/python scripts/chay_patch.py sql/rollback_zzzzzzzh_is_current_theo_dot.sql
```

Đọc điều kiện ở đầu file rollback trước khi chạy. Rollback hạ is_current dòng cũ hơn trong mỗi bộ (mã, khoa, năm) trùng. Nó tự dừng nếu dòng sắp bị hạ đã qua bước gửi.
