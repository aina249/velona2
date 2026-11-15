import React from "react";
import { PUBLIC_CONTACT, whatsappLink } from "../../lib/publicContact";

export function WhatsAppLink({ className = "", message }) {
  return (
    <a
      className={className}
      href={whatsappLink(message)}
      target="_blank"
      rel="noreferrer"
    >
      {PUBLIC_CONTACT.whatsappDisplay}
    </a>
  );
}

export function EmailLink({ className = "" }) {
  return (
    <a className={className} href={`mailto:${PUBLIC_CONTACT.email}`}>
      {PUBLIC_CONTACT.email}
    </a>
  );
}

export function FooterContactDetails() {
  return (
    <>
      WhatsApp : <WhatsAppLink className="vac-footer-link" />
      <br />
      E-mail : <EmailLink className="vac-footer-link" />
      <br />
      Cabinet : {PUBLIC_CONTACT.cabinetAddress}
      <br />
      Livraison : {PUBLIC_CONTACT.deliveryArea}
    </>
  );
}
