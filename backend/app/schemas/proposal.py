from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator, model_validator


class ProposalReasonIn(BaseModel):
    loai_ly_do: Literal["theo_lich_su", "ky_thuat_moi", "thay_doi_phac_do", "khac"]
    ten_ky_thuat_moi: str | None = None
    uoc_ca_thang: float | None = None
    ghi_chu: str | None = None

    @model_validator(mode="after")
    def ky_thuat_moi_bat_buoc_ten(self):
        # Test nghiệm thu G1: chọn "kỹ thuật mới" mà bỏ trống tên -> 422
        if self.loai_ly_do == "ky_thuat_moi" and not (self.ten_ky_thuat_moi or "").strip():
            raise ValueError(
                "Chọn lý do 'kỹ thuật mới' bắt buộc phải điền tên kỹ thuật (ten_ky_thuat_moi)."
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
        return self

    @property
    def so_thang_du_kien(self) -> int:
        return (self.den_nam * 12 + self.den_thang) - (self.tu_nam * 12 + self.tu_thang) + 1


class PackageAssignIn(BaseModel):
    ma_quan_ly: str
    nam: int
    goi_thau_id: int
    assigned_by: EmailStr
