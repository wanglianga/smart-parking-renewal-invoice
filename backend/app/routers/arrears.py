from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/arrears", tags=["欠费拦截"])


@router.post("", response_model=schemas.ArrearsResponse)
def create_arrears(arrears: schemas.ArrearsCreate, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(models.Owner.id == arrears.owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")
    new_arrears = models.Arrears(**arrears.model_dump())
    db.add(new_arrears)
    db.commit()
    db.refresh(new_arrears)
    return new_arrears


@router.get("", response_model=List[schemas.ArrearsResponse])
def list_arrears(owner_id: int = None, status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Arrears)
    if owner_id:
        query = query.filter(models.Arrears.owner_id == owner_id)
    if status:
        query = query.filter(models.Arrears.status == status)
    return query.order_by(models.Arrears.created_at.desc()).all()


@router.get("/check/{owner_id}", response_model=schemas.ArrearsCheckResponse)
def check_arrears(owner_id: int, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")

    unpaid_arrears = db.query(models.Arrears).filter(
        models.Arrears.owner_id == owner_id,
        models.Arrears.status == "unpaid"
    ).all()

    total_arrears = sum(a.amount for a in unpaid_arrears)

    latest_renewal = db.query(models.Renewal).filter(
        models.Renewal.owner_id == owner_id
    ).order_by(models.Renewal.created_at.desc()).first()

    coupon_usage = None
    if latest_renewal and latest_renewal.coupon_id:
        db_coupon = db.query(models.Coupon).filter(
            models.Coupon.id == latest_renewal.coupon_id
        ).first()
        if db_coupon:
            coupon_usage = {
                "coupon_id": db_coupon.id,
                "coupon_name": db_coupon.name,
                "coupon_code": db_coupon.code,
                "discount_type": db_coupon.discount_type,
                "discount_value": db_coupon.discount_value,
                "original_amount": latest_renewal.original_amount,
                "discount_amount": latest_renewal.discount_amount,
                "final_amount": latest_renewal.final_amount
            }

    has_arrears = total_arrears > 0
    if has_arrears:
        final_status = "arrears_exists"
    elif latest_renewal and latest_renewal.status == "paid":
        final_status = "normal"
    elif latest_renewal and latest_renewal.status == "pending":
        final_status = "pending_payment"
    else:
        final_status = "no_record"

    summary_parts = []
    summary_parts.append("车主：{}（车牌：{}）".format(db_owner.name, db_owner.plate_number))
    if latest_renewal:
        summary_parts.append("最近续费：原价{}元".format(latest_renewal.original_amount))
        if coupon_usage:
            summary_parts.append(
                "使用优惠券[{}]抵扣{}元".format(
                    coupon_usage["coupon_name"],
                    coupon_usage["discount_amount"]
                )
            )
        summary_parts.append("实付{}元".format(latest_renewal.final_amount))
        summary_parts.append("续费状态：{}".format(latest_renewal.status))
    else:
        summary_parts.append("暂无续费记录")
    if has_arrears:
        summary_parts.append(
            "欠费拦截触发：存在{}笔欠费，合计{}元".format(len(unpaid_arrears), total_arrears)
        )
    else:
        summary_parts.append("欠费拦截通过：无欠费记录")
    summary_parts.append("最终口径：{}".format(final_status))
    summary = "；".join(summary_parts)

    for a in unpaid_arrears:
        a.checked_at = datetime.now()
        a.status = "checked"
    db.commit()

    return schemas.ArrearsCheckResponse(
        owner_id=db_owner.id,
        owner_name=db_owner.name,
        plate_number=db_owner.plate_number,
        has_arrears=has_arrears,
        total_arrears_amount=total_arrears,
        arrears_list=unpaid_arrears,
        latest_renewal=latest_renewal,
        final_status=final_status,
        summary=summary,
        coupon_usage=coupon_usage
    )


@router.post("/settle/{arrears_id}", response_model=schemas.ArrearsResponse)
def settle_arrears(arrears_id: int, db: Session = Depends(get_db)):
    db_arrears = db.query(models.Arrears).filter(models.Arrears.id == arrears_id).first()
    if not db_arrears:
        raise HTTPException(status_code=404, detail="欠费记录不存在")
    db_arrears.status = "paid"
    db_arrears.updated_at = datetime.now()
    db.commit()
    db.refresh(db_arrears)
    return db_arrears
