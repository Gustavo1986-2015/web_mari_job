// Estado compartido de la escena, mutado en cada frame (sin re-render de React).
export type Rig = {
  floor: number; // piso continuo suavizado
  cabinY: number;
  velocity: number; // pisos por segundo
  open: number; // 0 = puertas cerradas, 1 = abiertas
  intro: number; // 0 -> 1 durante la animación de entrada
  pointer: { x: number; y: number };
};

export const createRig = (): Rig => ({
  floor: 0,
  cabinY: 0,
  velocity: 0,
  open: 0,
  intro: 0,
  pointer: { x: 0, y: 0 },
});
