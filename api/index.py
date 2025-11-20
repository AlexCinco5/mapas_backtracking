from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
from fastapi.middleware.cors import CORSMiddleware
from .motor_coloreo import colorear_mapa_backtracking

app = FastAPI()

# Configuración CORS para permitir peticiones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatosColoreo(BaseModel):
    mapa_regiones: Dict[str, List[str]]
    num_colores: int

# Ruta ajustada para Vercel
@app.post("/api/resolver_coloreo")
def resolver_coloreo(datos: DatosColoreo):
    resultado = colorear_mapa_backtracking(
        datos.mapa_regiones,
        datos.num_colores
    )
    
    return {
        "mensaje": "Proceso completado",
        "solucion_encontrada": resultado["solucion"] is not None,
        "asignacion_final": resultado["solucion"],
        "animacion_pasos": resultado["proceso"]
    }

# Ruta de prueba
@app.get("/api/test")
def home():
    return {"estado": "Backend Python en Vercel OK 🚀"}