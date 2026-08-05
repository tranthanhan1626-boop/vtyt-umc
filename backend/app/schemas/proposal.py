from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator, model_validator


class ProposalReasonIn(BaseModel):
    loai_ly_do: Literal["theo_lich_su", "ky_thuat_moi", "thay_doi_phac_do", "khac"]
    ten_ky_thuat_moi: str | None = None
    uoc_ca_thang: float | None = None
    ghi_chu: str | None = None

    @model_validator(mode="after")
    def kiem_tra_noi_dung_ly_do(self):
        # Test nghiệm thu G1: chọn "kỹ thuật mới" mà bỏ trống tên -> 422
        if self.loai_ly_do == "ky_thuat_moi" and not (self.ten_ky_thuat_moi or "").strip():
            raise ValueError(
                "Chọn lý do 'kỹ thuật mới' bắt buộc phải điền tên kỹ thuật (ten_ky_thuat_moi)."
            )
        if self.loai_ly_do != "theo_lich_su" and not (self.ghi_chu or "").strip():
            raise ValueError(
                "Số lượng ngoài khoảng P50-P75 bắt buộc phải có ghi chú cụ thể."
            )
        return self


class ProposalIn(BaseModel):
    ma_hang: str
    don_vi: str
    nam_de_xuat: int
    so_luong: float
    loai_mua_sam: Literal["mua_sam_bo_sung", "chi_dinh_thau", "dau_thau_rong_rai"]
    goi: str | None = None
    tu_thang: int
    tu_nam: int
    den_thang: int
    den_nam: int
    so_luong_ma_quan_ly: float | None = None
    dvt_ma_quan_ly: str | None = None
    he_so_quy_doi: float | None = None
    bang_quy_doi: dict[str, float] | None = None
    created_by: EmailStr
    reason: ProposalReasonIn

    @field_validator("so_luong")
    @classmethod
    def so_luong_duong(cls, v: float):
        if v <= 0:
            raise ValueError("Số lượng đề xuất phải lớn hơn 0.")
        return v

    @model_validator(mode="after")
    def ky_su_dung_hop_le(self):
        if not 1 <= self.tu_thang <= 12 or not 1 <= self.den_thang <= 12:
            raise ValueError("Tháng sử dụng phải nằm trong khoảng 1-12.")
        bat_dau = self.tu_nam * 12 + self.tu_thang
        ket_thuc = self.den_nam * 12 + self.den_thang
        if ket_thuc < bat_dau:
            raise ValueError("Mốc kết thúc phải sau mốc bắt đầu.")
        co_du_lieu_cap_ma_quan_ly = any(
            value is not None
            for value in (
                self.so_luong_ma_quan_ly,
                self.dvt_ma_quan_ly,
                self.he_so_quy_doi,
                self.bang_quy_doi,
            )
        )
        if co_du_lieu_cap_ma_quan_ly:
            dvt = (self.dvt_ma_quan_ly or "").strip()
            if (
                not dvt
                or not (self.so_luong_ma_quan_ly and self.so_luong_ma_quan_ly > 0)
                or not (self.he_so_quy_doi and self.he_so_quy_doi > 0)
                or not self.bang_quy_doi
                or any(value <= 0 for value in self.bang_quy_doi.values())
                or abs(self.bang_quy_doi.get(dvt, 0) - 1) > 0.000001
            ):
                raise ValueError(
                    "Đề xuất cấp mã quản lý phải có ĐVT chuẩn, tổng và bảng quy đổi hợp lệ."
                )
        return self

    @property
    def so_thang_du_kien(self) -> int:
        return (self.den_nam * 12 + self.den_thang) - (self.tu_nam * 12 + self.tu_thang) + 1


class PackageAssignIn(BaseModel):
    ma_quan_ly: str
    nam: int
    goi_thau_id: int
    assigned_by: EmailStr
