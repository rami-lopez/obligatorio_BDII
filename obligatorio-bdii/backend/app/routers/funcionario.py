from fastapi import APIRouter, Depends, HTTPException
from app.services.funcionario import get_evento_funcionario
from app.schemas.funcionario import EventoFuncionarioResponse
from app.db.dependencies import get_current_user

router = APIRouter(prefix="/funcionarios", tags=["Funcionarios"])


@router.get("/me/evento", response_model=list[EventoFuncionarioResponse])
async def read_mi_evento(current_user: dict = Depends(get_current_user)):
    
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    mail = current_user["mail"]

    data = await get_evento_funcionario(mail)

    if not data:
        return []

    return data