def es_color_valido(region, color, asignacion_colores, mapa_regiones):
    # Verificar vecinos
    for vecino in mapa_regiones.get(region, []):
        if vecino in asignacion_colores and asignacion_colores[vecino] == color:
            return False
    return True

def colorear_mapa_backtracking(mapa_regiones, num_colores):
    regiones = list(mapa_regiones.keys())
    asignacion_colores = {}
    historial_pasos = []
    
    # Colores del 1 al N
    COLORES = list(range(1, num_colores + 1))

    def backtrack_recursivo(indice_region_actual):
        # Caso Base: Si hemos asignado color a todas las regiones
        if indice_region_actual == len(regiones):
            return True

        region_actual = regiones[indice_region_actual]

        for color_intento in COLORES:
            # 1. Registrar el intento (Animación)
            historial_pasos.append({
                "region": region_actual,
                "color_intento": color_intento,
                "valido": False,
                "retroceso": False
            })

            # 2. Verificar validez
            if es_color_valido(region_actual, color_intento, asignacion_colores, mapa_regiones):
                # Asignar
                asignacion_colores[region_actual] = color_intento
                historial_pasos[-1]["valido"] = True 

                # 3. Paso Recursivo (Siguiente región)
                if backtrack_recursivo(indice_region_actual + 1):
                    return True

                # 4. Backtracking (Si el futuro falla, deshacer)
                del asignacion_colores[region_actual]
                historial_pasos.append({
                    "region": region_actual,
                    "color_intento": None,
                    "valido": False,
                    "retroceso": True
                })
            
        return False

    if backtrack_recursivo(0):
        return {
            "solucion": asignacion_colores,
            "proceso": historial_pasos
        }
    else:
        return {
            "solucion": None,
            "proceso": historial_pasos
        }