# Archivo: api_backtracking.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
from motor_coloreo import colorear_mapa_backtracking
from fastapi.middleware.cors import CORSMiddleware # Permite que el frontend acceda

# Inicializar la aplicación principal de FastAPI.
app = FastAPI()

# Configuración de seguridad (CORS) para permitir el acceso desde la web.
# Esto es vital para que tu frontend pueda hablar con tu backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir acceso desde cualquier URL (para desarrollo)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Definir la estructura de datos que esperamos recibir del Frontend.
class DatosColoreo(BaseModel):
    # mapa_regiones debe ser un diccionario (clave: región, valor: lista de vecinos)
    mapa_regiones: Dict[str, List[str]]
    # num_colores debe ser un número entero
    num_colores: int

# Definir el endpoint (ruta) para que el frontend envíe la solicitud.
@app.post("/resolver_coloreo/")
def resolver_coloreo(datos: DatosColoreo):
    """
    Recibe el mapa y el número de colores, y llama al motor de Backtracking.
    """
    # Llamamos a la función del motor con los datos recibidos.
    resultado = colorear_mapa_backtracking(
        datos.mapa_regiones,
        datos.num_colores
    )

    # Devolvemos la solución final y la lista de pasos para la animación.
    return {
        "mensaje": "Proceso de coloreo ejecutado.",
        "solucion_encontrada": resultado["solucion"] is not None,
        "asignacion_final": resultado["solucion"],
        "animacion_pasos": resultado["proceso"]
    }

# Ruta de prueba simple.
@app.get("/")
def estado_servicio():
    return {"estado": "Servicio de Backtracking operativo y listo."}