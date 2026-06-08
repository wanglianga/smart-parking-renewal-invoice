from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/packages", tags=["车位套餐"])


@router.post("", response_model=schemas.ParkingPackageResponse)
def create_package(pkg: schemas.ParkingPackageCreate, db: Session = Depends(get_db)):
    new_pkg = models.ParkingPackage(**pkg.model_dump())
    db.add(new_pkg)
    db.commit()
    db.refresh(new_pkg)
    return new_pkg


@router.get("", response_model=List[schemas.ParkingPackageResponse])
def list_packages(is_active: bool = None, db: Session = Depends(get_db)):
    query = db.query(models.ParkingPackage)
    if is_active is not None:
        query = query.filter(models.ParkingPackage.is_active == is_active)
    return query.all()


@router.get("/{package_id}", response_model=schemas.ParkingPackageResponse)
def get_package(package_id: int, db: Session = Depends(get_db)):
    db_pkg = db.query(models.ParkingPackage).filter(models.ParkingPackage.id == package_id).first()
    if not db_pkg:
        raise HTTPException(status_code=404, detail="套餐不存在")
    return db_pkg
