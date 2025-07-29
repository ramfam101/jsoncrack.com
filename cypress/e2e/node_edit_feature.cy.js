describe('Node Edit Feature', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/editor');
    // Wait for the editor to load
    cy.get('.monaco-editor', { timeout: 10000 }).should('be.visible');
  });

  it('should allow editing node values through the modal', () => {
    // Set initial JSON data
    const initialJson = {
      fruit: {
        name: "Apple",
        color: "Red",
        weight: "150g"
      },
      car: {
        model: "Model S",
        year: 2022,
        brand: "Tesla"
      }
    };

    // Type the JSON into the editor
    cy.get('.monaco-editor').click();
    cy.get('.monaco-editor textarea').type('{ctrl}a', { force: true });
    cy.get('.monaco-editor textarea').type(JSON.stringify(initialJson, null, 2), { force: true });

    // Wait for the graph to render
    cy.wait(2000);

    // Click on a node to open the modal
    cy.get('g[id^="ref-"][id*="node"] rect').first().click();

    // Verify modal is visible
    cy.get('.mantine-Modal-root').should('be.visible');
    cy.contains('Node Content').should('exist');

    // Click the Edit button
    cy.contains('button', 'Edit').click();

    // Verify edit mode is active
    cy.get('textarea').should('be.visible');
    cy.contains('button', 'Save').should('exist');
    cy.contains('button', 'Cancel').should('exist');

    // Edit the content
    cy.get('textarea').clear();
    cy.get('textarea').type('{"name": "Orange", "color": "Orange", "weight": "200g"}');

    // Save the changes
    cy.contains('button', 'Save').click();

    // Verify the modal shows the updated content
    cy.get('.mantine-Modal-root').should('contain', 'Orange');

    // Close the modal
    cy.get('.mantine-Modal-close').click();

    // Verify the left editor has been updated
    cy.get('.monaco-editor').should('contain', 'Orange');
  });

  it('should cancel edit without saving changes', () => {
    // Click on a node
    cy.get('g[id^="ref-"][id*="node"] rect').first().click();

    // Enter edit mode
    cy.contains('button', 'Edit').click();

    // Make changes
    cy.get('textarea').clear();
    cy.get('textarea').type('{"test": "value"}');

    // Cancel the changes
    cy.contains('button', 'Cancel').click();

    // Verify original content is preserved
    cy.get('.mantine-Modal-root').should('not.contain', 'test');
  });

  it('should show error for invalid JSON', () => {
    // Click on a node
    cy.get('g[id^="ref-"][id*="node"] rect').first().click();

    // Enter edit mode
    cy.contains('button', 'Edit').click();

    // Enter invalid JSON
    cy.get('textarea').clear();
    cy.get('textarea').type('{"invalid": json}');

    // Try to save
    cy.contains('button', 'Save').click();

    // Verify error handling (the modal should still be in edit mode)
    cy.get('textarea').should('be.visible');
    cy.contains('button', 'Save').should('exist');
  });
});