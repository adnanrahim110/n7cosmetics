export const officialDistributor = {
  name: "N7 Cosmetics",
  legalName: "N7 COSMETICS LIMITED",
  companyNumber: "15643763",
  website: "https://n7cosmetics.co.uk",
  companyUrl:
    "https://find-and-update.company-information.service.gov.uk/company/15643763",
  supplierUrl: "https://yusufbhaifragrances.com/pages/distributors",
  address: {
    street: "136 Station Road",
    locality: "Edgware",
    country: "England",
    postcode: "HA8 7AA",
  },
};

export const officialDistributorStructuredData = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${officialDistributor.website}/#organization`,
  name: officialDistributor.name,
  legalName: officialDistributor.legalName,
  url: `${officialDistributor.website}/`,
  description:
    "UK-registered online fragrance retailer and authorised UK distributor of Yusuf Bhai perfumes from the UAE.",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "UK Companies House Number",
    value: officialDistributor.companyNumber,
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: officialDistributor.address.street,
    addressLocality: officialDistributor.address.locality,
    postalCode: officialDistributor.address.postcode,
    addressCountry: "GB",
  },
  sameAs: [officialDistributor.companyUrl],
  subjectOf: {
    "@type": "WebPage",
    url: officialDistributor.supplierUrl,
    name: "Yusuf Bhai Fragrances – Authorised Distributors",
  },
};
