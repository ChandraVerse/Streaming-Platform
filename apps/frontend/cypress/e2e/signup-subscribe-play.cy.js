function uniqueEmail() {
  const stamp = Date.now().toString(36);
  return `test+${stamp}@example.com`;
}

describe("Signup, subscribe and play premium content", () => {
  it("creates an account, activates a subscription and opens a title", () => {
    const email = uniqueEmail();
    const password = "P@ssword123";

    cy.visit("/signup");
    cy.get('input[placeholder="Full name"]').type("Test User");
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.contains("Account created. Please sign in.").should("exist");

    cy.visit("/signin");
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.contains("Signed in. Open Dashboard.").should("exist");

    cy.visit("/subscribe");
    cy.contains("Choose Your Plan").should("exist");
    cy.get('input[name="plan"]').first().check({ force: true });
    cy.contains("Activate Subscription").click();
    cy.contains("Subscription activated successfully.").should("exist");

    cy.visit("/dashboard");
    cy.contains("Subscription Plans").should("exist");

    cy.visit("/browse");
    cy.get("a")
      .filter('[href^="/title/"]')
      .first()
      .click();
    cy.url().should("include", "/title/");
  });
});

