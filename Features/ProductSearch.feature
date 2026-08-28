@FeatureAutomationExercise
Feature: Automation Exercise Product Search

  @TC_006
  Scenario: TC_001 - Verify Product Search Completes Successfully for a Valid Keyword
    Given the user opens the application URL
    When the user clicks "Signup / Login" link
    When the user clicks "Products" link
    When the user enters search keyword "shirt"
    When the user clicks search submit button
    Then the user should see searched products heading
    Then the search results should contain the keyword "shirt"
    Then the success confirmation message should be detected
