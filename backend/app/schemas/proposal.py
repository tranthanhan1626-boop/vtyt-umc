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
    so_luong_thang: dict[str, float]  # key "1".."12"
    created_by: EmailStr
    reason: ProposalReasonIn

    @field_validator("so_luong_thang")
    @classmethod
    def phai_du_12_thang(cls, v: dict[str, float]):
        thieu = [str(t) for t in range(1, 13) if str(t) not in v]
        if thieu:
            raise ValueError(f"Thiếu số lượng cho các tháng: {thieu} — phải nhập đủ 12 tháng.")
        am = [t for t, so in v.items() if so < 0]
        if am:
            raise ValueError(f"Số lượng không được âm ở tháng: {am}")
        return v


class PackageAssignIn(BaseModel):
    ma_quan_ly: str
    nam: int
    goi_thau_id: int
    assigned_by: EmailStr
