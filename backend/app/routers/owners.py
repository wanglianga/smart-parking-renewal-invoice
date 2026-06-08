from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/owners", tags=["车主档案"])


@router.post("", response_model=schemas.OwnerResponse)
def create_owner(owner: schemas.OwnerCreate, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(
        (models.Owner.phone == owner.phone) |
        (models.Owner.plate_number == owner.plate_number)
    ).first()
    if db_owner:
        raise HTTPException(status_code=400, detail="手机号或车牌号已存在")
    new_owner = models.Owner(**owner.model_dump())
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    return new_owner


@router.get("", response_model=List[schemas.OwnerResponse])
def list_owners(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Owner).offset(skip).limit(limit).all()


@router.get("/{owner_id}", response_model=schemas.OwnerResponse)
def get_owner(owner_id: int, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")
    return db_owner


@router.put("/{owner_id}", response_model=schemas.OwnerResponse)
def update_owner(owner_id: int, owner: schemas.OwnerUpdate, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")
    update_data = owner.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_owner, key, value)
    db.commit()
    db.refresh(db_owner)
    return db_owner


@router.delete("/{owner_id}")
def delete_owner(owner_id: int, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")
    db.delete(db_owner)
    db.commit()
    return {"message": "删除成功"}
