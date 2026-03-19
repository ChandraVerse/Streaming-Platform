describe("OTT flows", () => {
  it("loads live page", () => {
    cy.visit("/live");
    cy.contains("Live TV and Sports");
  });

  it("loads social page", () => {
    cy.visit("/social");
    cy.contains("Social");
  });

  it("loads admin content page", () => {
    cy.visit("/admin/content");
    cy.contains("Admin Content Management");
  });
});
