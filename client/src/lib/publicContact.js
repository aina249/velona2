export const PUBLIC_CONTACT = {
  whatsappNumber: "261380832020",
  whatsappDisplay: "+261 38 08 320 20",
  cabinetAddress: "Ivandry, Antananarivo",
  email: "randriamasinjakaandriniaina@gmail.com",
  deliveryArea: "Antananarivo centre",
};

export const PRACTICAL_INFORMATION = {
  consultation: "Bilan nutritionnel de 60 min, au cabinet ou en visio.",
  schedule: "Lundi–vendredi : 9h–12h et 14h–17h · samedi : 9h–12h.",
  booking: "Réservation au moins 12 h à l’avance ; annulation possible jusqu’à 12 h avant le rendez-vous.",
  payment: "Mobile Money (MVola, Orange Money ou Airtel Money), espèces ou virement.",
};

export function whatsappLink(message = "Bonjour Vélona, j'aimerais avoir plus d'informations.") {
  return `https://wa.me/${PUBLIC_CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
