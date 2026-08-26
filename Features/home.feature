@FeatureHome
@smoke @regression @home
Feature: Login and Home Page

	Background:
		Given the user navigates to the site

	@home @TC_001
	Scenario: TC_001 - Verify the home page loads with its logo and heading
		Then the home page logo should be visible
		And the home page main heading should be visible
		And the home page navigation should show the Home link
		And the features items section should be visible

	@signup @TC_002
	Scenario: TC_002 - Register a new user account
		When the user navigates to the signup/login page
		And the user registers a new account with random details
		Then the account created confirmation should be visible
		And the user continues past the account created confirmation

	@signup @TC_003
	Scenario: TC_003 - Registered user is logged in and can see the delete account option
		When the user navigates to the signup/login page
		And the user registers a new account with random details
		Then the account created confirmation should be visible
		And the user continues past the account created confirmation
		And the user should be logged in as the registered user
		And the delete account link should be visible in the navigation

	@signup @TC_004
	Scenario: TC_004 - Registered user can log out and log back in with their credentials
		When the user navigates to the signup/login page
		And the user registers a new account with random details
		Then the account created confirmation should be visible
		And the user continues past the account created confirmation
		And the user should be logged in as the registered user
		When the user logs out
		And the user navigates to the signup/login page
		And the user logs in with the registered account credentials
		Then the user should be logged in as the registered user

	@signup @TC_005
	Scenario: TC_005 - Login with incorrect credentials shows an error message
		When the user navigates to the signup/login page
		And the user registers a new account with random details
		Then the account created confirmation should be visible
		And the user continues past the account created confirmation
		When the user logs out
		And the user navigates to the signup/login page
		And the user logs in with incorrect credentials
		Then the invalid login error message should be visible

