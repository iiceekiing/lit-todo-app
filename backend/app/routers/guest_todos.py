from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from .. import schemas, models, database

router = APIRouter(tags=["Guest Todos"])

@router.post("", response_model=schemas.GuestTodoResponse, status_code=status.HTTP_201_CREATED)
def create_guest_todo(
    todo: schemas.GuestTodoCreate, 
    db: Session = Depends(database.get_db)
):
    new_todo = models.GuestTodo(**todo.model_dump())
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@router.get("", response_model=List[schemas.GuestTodoResponse])
def get_guest_todos(db: Session = Depends(database.get_db)):
    # Guest todos are public to everyone.
    todos = db.query(models.GuestTodo).order_by(models.GuestTodo.created_at.desc()).all()
    return todos
