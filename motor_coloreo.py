# Archivo: motor_coloreo.py

def es_color_valido(region, color, asignacion_colores, mapa_regiones):
    """
    Verifica si 'color' se puede asignar a 'region' sin conflicto con sus vecinas.
    """
    # Recorrer todas las regiones vecinas de la región que estamos analizando
    for vecino in mapa_regiones.get(region, []):
        # Comprobar si el vecino ya tiene un color asignado
        if vecino in asignacion_colores and asignacion_colores[vecino] == color:
            # Si el vecino ya está coloreado con este mismo color, hay CONFLICTO
            return False
    return True # No hay conflicto, el color es VÁLIDO

def colorear_mapa_backtracking(mapa_regiones, num_colores):
    """
    Implementa el algoritmo de Backtracking para colorear el mapa.
    """
    regiones = list(mapa_regiones.keys()) # Lista de todas las regiones
    asignacion_colores = {} # Diccionario para guardar el resultado: {"Region": color}
    historial_pasos = [] # Lista clave para la animación, guarda cada intento

    # Definimos los colores disponibles (usaremos números, por ejemplo: 1, 2, 3)
    COLORES = list(range(1, num_colores + 1))

    # Definición de la función recursiva de Backtracking
    def backtrack_recursivo(indice_region_actual):
        
        # COMENTARIO: Condición base - Si el índice es igual al número total de regiones,
        # significa que todas las regiones han sido coloreadas EXITOSAMENTE.
        if indice_region_actual == len(regiones):
            return True # ¡Éxito!

        region_actual = regiones[indice_region_actual] # La región que vamos a intentar colorear

        # COMENTARIO: Intentamos colorear la región actual con cada color disponible.
        for color_intento in COLORES:
            
            # COMENTARIO: Registramos el paso para la animación, antes de la verificación.
            paso = {
                "region": region_actual,
                "color_intento": color_intento,
                "valido": False,
                "retroceso": False
            }
            historial_pasos.append(paso)

            # COMENTARIO: Verificamos si este color es seguro para la región actual.
            if es_color_valido(region_actual, color_intento, asignacion_colores, mapa_regiones):
                
                # COMENTARIO: ¡Éxito! El color es válido. Lo asignamos y marcamos el paso.
                asignacion_colores[region_actual] = color_intento
                historial_pasos[-1]["valido"] = True # Actualizamos el paso anterior

                # COMENTARIO: Llamada recursiva: intentamos colorear la siguiente región.
                if backtrack_recursivo(indice_region_actual + 1):
                    return True # Si la siguiente rama encuentra la solución, la propagamos.

                # COMENTARIO: Si volvemos aquí, significa que la rama falló. ¡RETROCESO!
                # Deshacemos la asignación de color en la región actual.
                del asignacion_colores[region_actual]
                
                # COMENTARIO: Registramos el retroceso para la animación.
                historial_pasos.append({
                    "region": region_actual,
                    "color_intento": None,
                    "valido": False,
                    "retroceso": True # Indicamos que se ha deshecho la asignación
                })
            
            # COMENTARIO: Si el color no era válido, el bucle sigue con el siguiente color.
            # No se hace nada, ya que el color nunca se asignó.

        # COMENTARIO: Si el bucle termina, ningún color funcionó para esta región.
        # Retorna False para que la llamada anterior haga un retroceso.
        return False

    # COMENTARIO: Iniciamos el proceso desde la primera región (índice 0).
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