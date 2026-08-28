@FeatureProductSearch
Feature: Product Search

  Scenario: TC_001 - Verify Product Search Returns Matching Results and Success Confirmation
    Given the user opens the Automation Exercise application
    When the user clicks the Products link
    When the user fills the search input with "T - SHIRT"
    When the user clicks the submit search button
    Then the searched products heading should be visible
    Then the search results should not contain any product wrappers or names
