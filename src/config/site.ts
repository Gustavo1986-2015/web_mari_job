// Datos centrales del estudio. Todo cambio de contacto o de servicios se hace acá.

export const site = {
  name: 'Mariana Soregaroli & Asoc.',
  shortName: 'Soregaroli',
  tagline: 'Estudio Técnico de Ascensores',
  description:
    'Habilitación de ascensores y montacargas, Oblea Código QR Res. N.º 430, obtención y renovación de Permiso de Conservador, Libro Digital de Inspección y levantamiento de clausuras en CABA. Más de 15 años de experiencia ante el G.C.B.A.',
  keywords:
    'oblea QR, Resolución 430, habilitación de ascensores, habilitación de montacargas, libro digital de inspección, permiso de conservador, levantamiento de clausura, transferencia de titularidad, duplicado de expediente, campanas extractoras, estudio técnico ascensores, CABA, Caballito',
  location: 'CABA, Buenos Aires, Argentina',
  years: 15,
  phone: {
    display: '011 3647-0060',
    href: 'tel:+541136470060',
  },
  whatsapp: {
    // Formato internacional para celulares de Argentina: 54 9 + característica + número.
    number: '5491136470060',
    message: 'Hola, quisiera hacer una consulta sobre un trámite de ascensores.',
  },
  emails: ['estudiosoregaroli@hotmail.com', 'estudiosoregaroli@gmail.com'],
} as const;

export const whatsappUrl = (message: string = site.whatsapp.message) =>
  `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;

// Formulario: FormSubmit envía al correo principal y copia (_cc) al secundario.
// El primer envío dispara un email de activación a la casilla principal.
export const form = {
  endpoint: `https://formsubmit.co/ajax/${site.emails[0]}`,
  cc: site.emails.slice(1).join(','),
  subject: 'Nueva solicitud de cotización — web Soregaroli',
};

// Servicios técnicos (piso 2).
export const technicalServices = [
  { icon: 'cpu', title: 'Rehabilitaciones', text: 'Por cambio de controles electromecánicos a electrónicos.' },
  { icon: 'file-text', title: 'Informes técnicos', text: 'Para la adecuación de ascensores a las normativas vigentes.' },
  {
    icon: 'clipboard-list',
    title: 'Pliegos técnicos',
    text: 'Confección de pliegos de características técnicas para la ejecución de modernizaciones.',
  },
  {
    icon: 'search-check',
    title: 'Auditorías técnicas',
    text: 'Evaluación del estado de seguridad y funcionamiento de la instalación.',
  },
] as const;

// Oblea Código QR: instalaciones alcanzadas.
export const qrInstallations = ['Ascensores', 'Instalaciones térmicas', 'Incendio', 'Campanas extractoras'] as const;

// Trámite destacado de Gestoría.
export const habilitacion = {
  icon: 'badge-check',
  title: 'Habilitación de ascensores y montacargas',
  text: 'Gestionamos la habilitación completa de la instalación ante el G.C.B.A., desde la documentación técnica hasta la aprobación final.',
  service: 'Habilitación de ascensores y montacargas',
} as const;

// Gestoría (piso 1): los trámites más solicitados (~80% del trabajo del estudio).
export const paperwork = [
  {
    icon: 'id-card',
    title: 'Obtención y renovación del Permiso de Conservador',
    text: 'Tramitamos el permiso y su renovación en término, con toda la documentación requerida.',
    service: 'Obtención / Renovación de Permiso de Conservador',
  },
  {
    icon: 'book-open-check',
    title: 'Libro Digital de Inspección',
    text: 'Gestionamos el alta y el seguimiento del libro digital de la instalación.',
    service: 'Libro Digital de Inspección',
  },
  {
    icon: 'arrow-left-right',
    title: 'Transferencia de Titularidad de Habilitación',
    text: 'Realizamos el cambio de titular de la habilitación ante el G.C.B.A.',
    service: 'Transferencia de Titularidad de Habilitación',
  },
  {
    icon: 'file-stack',
    title: 'Duplicado de Expediente de Habilitación',
    text: 'Recuperamos la documentación de habilitación cuando el expediente original no está disponible.',
    service: 'Duplicado de Expediente de Habilitación',
  },
  {
    icon: 'house',
    title: 'Informe de Dominio del inmueble',
    text: 'Obtenemos el informe de dominio que respalda los trámites del edificio.',
    service: 'Informe de Dominio del inmueble',
  },
  {
    icon: 'lock-open',
    title: 'Levantamiento de Clausuras',
    text: 'Resolvemos las observaciones y gestionamos el levantamiento para volver a habilitar la instalación.',
    service: 'Levantamiento de Clausura',
  },
] as const;

export const totalServices = technicalServices.length + paperwork.length + 2; // + habilitación y Oblea QR

// Opciones del formulario.
export const services = [
  habilitacion.service,
  ...paperwork.map((p) => p.service),
  'Oblea Código QR (Res. N.º 430)',
  'Rehabilitación / Modernización',
  'Informe técnico / Auditoría',
  'Otro',
] as const;
