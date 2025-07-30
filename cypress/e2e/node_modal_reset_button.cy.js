describe('NodeModal Reset Button', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/editor');
    
    // Wait for the graph to load
    cy.get('g[id^="ref-"][id*="node"] rect', { timeout: 10000 }).should('be.visible');
  });

  it('should show reset button in node modal and verify it works for text values', () => {
    // First find the person.name node (should contain "Alice")
    cy.contains('name').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Verify modal opens with content
    cy.get('.mantine-Modal-root').should('be.visible');
    cy.contains('Content').should('exist');
    
    // Verify Reset button exists
    cy.contains('button', 'Reset to Default').should('exist');
    
    // Click Edit button
    cy.contains('button', 'Edit Node Content').click();
    
    // Edit content with a test value
    cy.get('textarea').clear().type('TestModifiedValue');
    
    // Save the changes
    cy.contains('button', 'Save Changes').click();
    
    // Reopen the modal
    cy.contains('TestModifiedValue').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Verify content has changed
    cy.get('.mantine-CodeHighlight-root').should('contain', 'TestModifiedValue');
    
    // Click Reset to Default button
    cy.contains('button', 'Reset to Default').click();
    
    // The toast message should appear
    cy.contains('Node reset to default value').should('exist');
    
    // Wait for the graph to update
    cy.wait(1000);
    
    // Reopen a node to verify reset - should now contain "Alice" again
    cy.contains('name').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Content should no longer contain our test value
    cy.get('.mantine-CodeHighlight-root').should('not.contain', 'TestModifiedValue');
    cy.get('.mantine-CodeHighlight-root').should('contain', 'Alice');
    
    // Close the modal
    cy.get('.mantine-Modal-close').click();
  });
  
  it('should reset numeric values correctly', () => {
    // Find the person.age node (should contain 30)
    cy.contains('age').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Verify modal opens with content
    cy.get('.mantine-Modal-root').should('be.visible');
    
    // Click Edit button
    cy.contains('button', 'Edit Node Content').click();
    
    // Change value to 50
    cy.get('textarea').clear().type('50');
    
    // Save the changes
    cy.contains('button', 'Save Changes').click();
    
    // Reopen the modal
    cy.contains('50').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Verify content changed to 50
    cy.get('.mantine-CodeHighlight-root').should('contain', '50');
    
    // Click Reset to Default button
    cy.contains('button', 'Reset to Default').click();
    
    // Wait for update
    cy.wait(1000);
    
    // Reopen node to verify reset - should now contain 30 again
    cy.contains('age').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Content should show original value
    cy.get('.mantine-CodeHighlight-root').should('contain', '30');
    
    // Close the modal
    cy.get('.mantine-Modal-close').click();
  });
  
  it('should reset object values correctly', () => {
    // Find the fruit node (should be an object)
    cy.contains('fruit').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Click Edit button
    cy.contains('button', 'Edit Node Content').click();
    
    // Add a new property to fruit
    cy.get('textarea').invoke('val', '{\n  "name": "Orange",\n  "color": "Orange",\n  "taste": "Sweet"\n}').trigger('change');
    
    // Save the changes
    cy.contains('button', 'Save Changes').click();
    
    // Reopen the modal
    cy.contains('fruit').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Verify content has changed
    cy.get('.mantine-CodeHighlight-root').should('contain', 'Orange');
    cy.get('.mantine-CodeHighlight-root').should('contain', 'taste');
    
    // Click Reset to Default button
    cy.contains('button', 'Reset to Default').click();
    
    // Wait for update
    cy.wait(1000);
    
    // Reopen node to verify reset - should contain original values
    cy.contains('fruit').parents('g[id^="ref-"][id*="node"]').first().click();
    
    // Content should show original fruit object
    cy.get('.mantine-CodeHighlight-root').should('contain', 'Apple');
    cy.get('.mantine-CodeHighlight-root').should('contain', 'Red');
    cy.get('.mantine-CodeHighlight-root').should('contain', 'weight');
    cy.get('.mantine-CodeHighlight-root').should('not.contain', 'taste');
  });
});
