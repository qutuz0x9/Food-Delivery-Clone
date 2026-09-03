---
related-to: "[[Food Delivery Clone Overview]]"
---

# Customer Functional Requirements

Below is the **complete Customer Functional Requirements Table**, including both the parent requirements and their broken-down child requirements.

| ID             | Title                             | Functional Requirement                                                                                        |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **FR-CUS-001** | Launch Application                | The system shall allow the customer to launch and access the application.                                     |
| **FR-CUS-002** | Register Account                  | The system shall allow the customer to register a new account.                                                |
| FR-CUS-002.1   | Enter Registration Information    | The system shall allow the customer to enter the required registration information.                           |
| FR-CUS-002.2   | Validate Registration Information | The system shall validate the registration information.                                                       |
| FR-CUS-002.3   | Verify Email Uniqueness           | The system shall verify that the email address is unique before creating the account.                         |
| FR-CUS-002.4   | Create Customer Account           | The system shall create a customer account after successful validation.                                       |
| FR-CUS-002.5   | Notify Registration Success       | The system shall notify the customer that the account has been created successfully.                          |
| **FR-CUS-003** | Log In                            | The system shall allow the customer to log in using valid credentials.                                        |
| FR-CUS-003.1   | Enter Login Credentials           | The system shall allow the customer to enter their email and password.                                        |
| FR-CUS-003.2   | Validate Credentials              | The system shall validate the customer's credentials.                                                         |
| FR-CUS-003.3   | Grant System Access               | The system shall grant access if the credentials are valid.                                                   |
| FR-CUS-003.4   | Display Login Error               | The system shall display an error message if the credentials are invalid.                                     |
| **FR-CUS-004** | Log Out                           | The system shall allow the customer to log out securely.                                                      |
| **FR-CUS-005** | Recover Password                  | The system shall allow the customer to recover a forgotten password.                                          |
| FR-CUS-005.1   | Request Password Reset            | The system shall allow the customer to request a password reset.                                              |
| FR-CUS-005.2   | Verify Customer Identity          | The system shall verify the customer's identity before resetting the password.                                |
| FR-CUS-005.3   | Create New Password               | The system shall allow the customer to create a new password.                                                 |
| **FR-CUS-006** | Manage Profile                    | The system shall allow the customer to manage their profile.                                                  |
| FR-CUS-006.1   | View Profile                      | The system shall allow the customer to view their profile information.                                        |
| FR-CUS-006.2   | Update Profile                    | The system shall allow the customer to update their profile information.                                      |
| FR-CUS-006.3   | Change Password                   | The system shall allow the customer to change their password.                                                 |
| **FR-CUS-007** | Manage Delivery Addresses         | The system shall allow the customer to manage delivery addresses.                                             |
| FR-CUS-007.1   | Add Delivery Address              | The system shall allow the customer to add a delivery address.                                                |
| FR-CUS-007.2   | Update Delivery Address           | The system shall allow the customer to update a delivery address.                                             |
| FR-CUS-007.3   | Delete Delivery Address           | The system shall allow the customer to delete a delivery address.                                             |
| FR-CUS-007.4   | Select Default Address            | The system shall allow the customer to select a default delivery address.                                     |
| **FR-CUS-008** | Browse Restaurants                | The system shall allow the customer to browse available restaurants.                                          |
| **FR-CUS-009** | Search Restaurants                | The system shall allow the customer to search for restaurants.                                                |
| **FR-CUS-010** | Filter Restaurants                | The system shall allow the customer to filter restaurants by available criteria.                              |
| **FR-CUS-011** | View Restaurant Details           | The system shall allow the customer to view restaurant details.                                               |
| **FR-CUS-012** | Browse Menu                       | The system shall allow the customer to browse a restaurant's menu.                                            |
| **FR-CUS-013** | View Food Details                 | The system shall allow the customer to view detailed information about food items.                            |
| **FR-CUS-014** | Search Food Items                 | The system shall allow the customer to search for food items.                                                 |
| **FR-CUS-015** | Add Item to Cart                  | The system shall allow the customer to add food items to the shopping cart.                                   |
| FR-CUS-015.1   | Select Food Item                  | The system shall allow the customer to select a food item.                                                    |
| FR-CUS-015.2   | Specify Quantity                  | The system shall allow the customer to specify the quantity of the selected item.                             |
| FR-CUS-015.3   | Add Item to Cart                  | The system shall add the selected item to the shopping cart.                                                  |
| FR-CUS-015.4   | Update Cart Total                 | The system shall update the shopping cart total after adding an item.                                         |
| **FR-CUS-016** | Update Shopping Cart              | The system shall allow the customer to update the shopping cart.                                              |
| FR-CUS-016.1   | Increase Quantity                 | The system shall allow the customer to increase the quantity of a cart item.                                  |
| FR-CUS-016.2   | Decrease Quantity                 | The system shall allow the customer to decrease the quantity of a cart item.                                  |
| FR-CUS-016.3   | Recalculate Cart Total            | The system shall recalculate the cart total after each modification.                                          |
| **FR-CUS-017** | Remove Item from Cart             | The system shall allow the customer to remove food items from the shopping cart.                              |
| **FR-CUS-018** | View Shopping Cart                | The system shall allow the customer to view the shopping cart before placing an order.                        |
| **FR-CUS-019** | Place Food Order                  | The system shall allow the customer to place a food order.                                                    |
| FR-CUS-019.1   | Select Delivery Address           | The system shall allow the customer to select a delivery address for the order.                               |
| FR-CUS-019.2   | Display Order Summary             | The system shall display an order summary before confirmation.                                                |
| FR-CUS-019.3   | Calculate Order Total             | The system shall calculate the total order amount, including applicable fees, taxes, and discounts.           |
| FR-CUS-019.4   | Confirm Order                     | The system shall allow the customer to confirm the order.                                                     |
| FR-CUS-019.5   | Generate Order Identifier         | The system shall generate a unique order identifier for each confirmed order.                                 |
| FR-CUS-019.6   | Submit Order to Restaurant        | The system shall submit the confirmed order to the selected restaurant.                                       |
| FR-CUS-019.7   | Save Order History                | The system shall save the order in the customer's order history.                                              |
| **FR-CUS-020** | Make Payment                      | The system shall allow the customer to make a payment.                                                        |
| FR-CUS-020.1   | Display Payment Methods           | The system shall display the available payment methods.                                                       |
| FR-CUS-020.2   | Select Payment Method             | The system shall allow the customer to select a payment method.                                               |
| FR-CUS-020.3   | Process Payment                   | The system shall process the payment securely.                                                                |
| FR-CUS-020.4   | Notify Payment Result             | The system shall notify the customer whether the payment was successful or unsuccessful.                      |
| FR-CUS-020.5   | Record Payment Transaction        | The system shall record the payment transaction.                                                              |
| **FR-CUS-021** | Track Order                       | The system shall allow the customer to track the status of an order.                                          |
| **FR-CUS-022** | Cancel Order                      | The system shall allow the customer to cancel an order in accordance with the platform's cancellation policy. |
| FR-CUS-022.1   | Request Order Cancellation        | The system shall allow the customer to submit an order cancellation request.                                  |
| FR-CUS-022.2   | Verify Cancellation Eligibility   | The system shall verify whether the order is eligible for cancellation.                                       |
| FR-CUS-022.3   | Update Order Status               | The system shall update the order status to **Cancelled** if the request is approved.                         |
| FR-CUS-022.4   | Notify Restaurant and Driver      | The system shall notify the restaurant and delivery driver when an order is cancelled.                        |
| **FR-CUS-023** | View Order History                | The system shall allow the customer to view their order history.                                              |
| **FR-CUS-024** | Rate Restaurant                   | The system shall allow the customer to rate a restaurant after a completed order.                             |
| **FR-CUS-025** | Submit Review                     | The system shall allow the customer to submit a review for a completed order.                                 |
| **FR-CUS-026** | Rate Delivery Driver              | The system shall allow the customer to rate the delivery driver after a completed delivery.                   |
| **FR-CUS-027** | Receive Notifications             | The system shall notify the customer of order-related events.                                                 |
| FR-CUS-027.1   | Notify Order Confirmation         | The system shall notify the customer when the order is confirmed.                                             |
| FR-CUS-027.2   | Notify Preparation Started        | The system shall notify the customer when the restaurant starts preparing the order.                          |
| FR-CUS-027.3   | Notify Driver Assignment          | The system shall notify the customer when a delivery driver is assigned.                                      |
| FR-CUS-027.4   | Notify Out for Delivery           | The system shall notify the customer when the order is out for delivery.                                      |
| FR-CUS-027.5   | Notify Order Delivered            | The system shall notify the customer when the order is delivered.                                             |
| FR-CUS-027.6   | Notify Order Cancelled            | The system shall notify the customer if the order is cancelled.                                               |

## Summary

|Category|Count|
|---|--:|
|Parent Functional Requirements|**27**|
|Child Functional Requirements|**47**|
|**Total Customer Functional Requirements**|**74**|

---

## Restaurant Functional Requirements

|ID|Title|Functional Requirement|
|---|---|---|
|**FR-RES-001**|Register Restaurant|The system shall allow a restaurant to register a new account.|
|FR-RES-001.1|Enter Registration Information|The system shall allow the restaurant to enter the required registration information.|
|FR-RES-001.2|Validate Registration Information|The system shall validate the registration information.|
|FR-RES-001.3|Verify Restaurant Information|The system shall verify the uniqueness and validity of the restaurant information.|
|FR-RES-001.4|Create Restaurant Account|The system shall create a restaurant account after successful validation.|
|FR-RES-001.5|Notify Registration Status|The system shall notify the restaurant of the registration result.|
|**FR-RES-002**|Log In|The system shall allow the restaurant to log in using valid credentials.|
|FR-RES-002.1|Enter Login Credentials|The system shall allow the restaurant to enter login credentials.|
|FR-RES-002.2|Validate Credentials|The system shall validate the entered credentials.|
|FR-RES-002.3|Grant System Access|The system shall grant access upon successful authentication.|
|FR-RES-002.4|Display Login Error|The system shall display an error message for invalid credentials.|
|**FR-RES-003**|Log Out|The system shall allow the restaurant to log out securely.|
|**FR-RES-004**|Recover Password|The system shall allow the restaurant to recover a forgotten password.|
|FR-RES-004.1|Request Password Reset|The system shall allow the restaurant to request a password reset.|
|FR-RES-004.2|Verify Restaurant Identity|The system shall verify the restaurant's identity before resetting the password.|
|FR-RES-004.3|Create New Password|The system shall allow the restaurant to create a new password.|
|**FR-RES-005**|Manage Restaurant Profile|The system shall allow the restaurant to manage its profile information.|
|FR-RES-005.1|View Restaurant Profile|The system shall allow the restaurant to view its profile information.|
|FR-RES-005.2|Update Restaurant Profile|The system shall allow the restaurant to update its profile information.|
|FR-RES-005.3|Upload Restaurant Logo|The system shall allow the restaurant to upload or update its logo.|
|**FR-RES-006**|Manage Operating Hours|The system shall allow the restaurant to manage its operating hours.|
|FR-RES-006.1|Set Opening Hours|The system shall allow the restaurant to define opening hours.|
|FR-RES-006.2|Set Closing Hours|The system shall allow the restaurant to define closing hours.|
|FR-RES-006.3|Update Operating Schedule|The system shall allow the restaurant to modify its operating schedule.|
|**FR-RES-007**|Manage Restaurant Availability|The system shall allow the restaurant to manage its availability status.|
|FR-RES-007.1|Mark Restaurant as Open|The system shall allow the restaurant to mark itself as open.|
|FR-RES-007.2|Mark Restaurant as Closed|The system shall allow the restaurant to mark itself as closed.|
|**FR-RES-008**|Manage Food Categories|The system shall allow the restaurant to manage food categories.|
|FR-RES-008.1|Add Food Category|The system shall allow the restaurant to add a food category.|
|FR-RES-008.2|Update Food Category|The system shall allow the restaurant to update a food category.|
|FR-RES-008.3|Delete Food Category|The system shall allow the restaurant to delete a food category.|
|**FR-RES-009**|Manage Menu Items|The system shall allow the restaurant to manage menu items.|
|FR-RES-009.1|Add Menu Item|The system shall allow the restaurant to add a menu item.|
|FR-RES-009.2|Update Menu Item|The system shall allow the restaurant to update a menu item.|
|FR-RES-009.3|Delete Menu Item|The system shall allow the restaurant to delete a menu item.|
|FR-RES-009.4|Set Menu Item Price|The system shall allow the restaurant to define the price of a menu item.|
|FR-RES-009.5|Upload Food Image|The system shall allow the restaurant to upload an image for a menu item.|
|FR-RES-009.6|Assign Menu Category|The system shall allow the restaurant to assign a menu item to a category.|
|**FR-RES-010**|Manage Menu Item Availability|The system shall allow the restaurant to manage menu item availability.|
|FR-RES-010.1|Mark Item Available|The system shall allow the restaurant to mark a menu item as available.|
|FR-RES-010.2|Mark Item Unavailable|The system shall allow the restaurant to mark a menu item as unavailable.|
|**FR-RES-011**|Receive Customer Orders|The system shall allow the restaurant to receive customer orders.|
|**FR-RES-012**|View Order Details|The system shall allow the restaurant to view complete order details.|
|FR-RES-012.1|View Customer Information|The system shall display customer information for the order.|
|FR-RES-012.2|View Ordered Items|The system shall display the ordered food items.|
|FR-RES-012.3|View Delivery Information|The system shall display delivery information for the order.|
|**FR-RES-013**|Accept or Reject Orders|The system shall allow the restaurant to accept or reject customer orders.|
|FR-RES-013.1|Accept Order|The system shall allow the restaurant to accept an order.|
|FR-RES-013.2|Reject Order|The system shall allow the restaurant to reject an order.|
|FR-RES-013.3|Notify Customer of Decision|The system shall notify the customer of the acceptance or rejection decision.|
|**FR-RES-014**|Update Order Status|The system shall allow the restaurant to update the status of an order.|
|FR-RES-014.1|Mark Order as Preparing|The system shall allow the restaurant to mark an order as preparing.|
|FR-RES-014.2|Mark Order as Ready for Pickup|The system shall allow the restaurant to mark an order as ready for pickup.|
|FR-RES-014.3|Notify Customer of Status|The system shall notify the customer when the order status changes.|
|FR-RES-014.4|Notify Driver for Pickup|The system shall notify the assigned driver when the order is ready for pickup.|
|**FR-RES-015**|View Active Orders|The system shall allow the restaurant to view active orders.|
|**FR-RES-016**|Search Orders|The system shall allow the restaurant to search for customer orders.|
|**FR-RES-017**|View Order History|The system shall allow the restaurant to view order history.|
|FR-RES-017.1|Filter Order History|The system shall allow the restaurant to filter order history.|
|FR-RES-017.2|View Completed Orders|The system shall allow the restaurant to view completed orders.|
|FR-RES-017.3|View Cancelled Orders|The system shall allow the restaurant to view cancelled orders.|
|**FR-RES-018**|Manage Promotions|The system shall allow the restaurant to manage promotional offers.|
|FR-RES-018.1|Create Promotion|The system shall allow the restaurant to create a promotion.|
|FR-RES-018.2|Update Promotion|The system shall allow the restaurant to update a promotion.|
|FR-RES-018.3|Delete Promotion|The system shall allow the restaurant to delete a promotion.|
|**FR-RES-019**|View Customer Reviews|The system shall allow the restaurant to view customer reviews and ratings.|
|**FR-RES-020**|Respond to Reviews|The system shall allow the restaurant to respond to customer reviews.|
|**FR-RES-021**|View Sales Dashboard|The system shall allow the restaurant to view sales statistics and performance reports.|
|FR-RES-021.1|View Total Sales|The system shall display total sales.|
|FR-RES-021.2|View Order Statistics|The system shall display order statistics.|
|FR-RES-021.3|View Revenue Reports|The system shall display revenue reports.|
|FR-RES-021.4|Filter Dashboard Data|The system shall allow filtering dashboard information by date or period.|
|**FR-RES-022**|Receive Notifications|The system shall notify the restaurant of important events.|
|FR-RES-022.1|Notify New Order|The system shall notify the restaurant of a new customer order.|
|FR-RES-022.2|Notify Order Cancellation|The system shall notify the restaurant when an order is cancelled.|
|FR-RES-022.3|Notify System Announcements|The system shall notify the restaurant of platform announcements and updates.|

## Restaurant Requirements Summary

|Category|Count|
|---|--:|
|Parent Functional Requirements|**22**|
|Child Functional Requirements|**49**|
|**Total Restaurant Functional Requirements**|**71**|

This collection provides full traceability for the **Restaurant** actor, from high-level capabilities to detailed system behaviors, and is suitable for inclusion in the Software Requirements Specification (SRS).

---

## Delivery Driver Functional Requirements

|ID|Title|Functional Requirement|
|---|---|---|
|**FR-DRV-001**|Register as Driver|The system shall allow a delivery driver to register a new account.|
|FR-DRV-001.1|Enter Registration Information|The system shall allow the driver to enter the required registration information.|
|FR-DRV-001.2|Validate Registration Information|The system shall validate the registration information.|
|FR-DRV-001.3|Verify Driver Information|The system shall verify the driver's information before account creation.|
|FR-DRV-001.4|Create Driver Account|The system shall create a driver account after successful validation.|
|FR-DRV-001.5|Notify Registration Status|The system shall notify the driver of the registration result.|
|**FR-DRV-002**|Log In|The system shall allow the driver to log in using valid credentials.|
|FR-DRV-002.1|Enter Login Credentials|The system shall allow the driver to enter login credentials.|
|FR-DRV-002.2|Validate Credentials|The system shall validate the driver's credentials.|
|FR-DRV-002.3|Grant System Access|The system shall grant access after successful authentication.|
|FR-DRV-002.4|Display Login Error|The system shall display an error message if authentication fails.|
|**FR-DRV-003**|Log Out|The system shall allow the driver to log out securely.|
|**FR-DRV-004**|Recover Password|The system shall allow the driver to recover a forgotten password.|
|FR-DRV-004.1|Request Password Reset|The system shall allow the driver to request a password reset.|
|FR-DRV-004.2|Verify Driver Identity|The system shall verify the driver's identity before resetting the password.|
|FR-DRV-004.3|Create New Password|The system shall allow the driver to create a new password.|
|**FR-DRV-005**|Manage Driver Profile|The system shall allow the driver to manage personal and vehicle information.|
|FR-DRV-005.1|View Driver Profile|The system shall allow the driver to view profile information.|
|FR-DRV-005.2|Update Driver Profile|The system shall allow the driver to update profile information.|
|FR-DRV-005.3|Update Vehicle Information|The system shall allow the driver to update vehicle information.|
|FR-DRV-005.4|Upload Profile Picture|The system shall allow the driver to upload or update a profile picture.|
|**FR-DRV-006**|Manage Availability|The system shall allow the driver to manage availability status.|
|FR-DRV-006.1|Set Status to Online|The system shall allow the driver to become available for deliveries.|
|FR-DRV-006.2|Set Status to Offline|The system shall allow the driver to stop receiving delivery requests.|
|**FR-DRV-007**|Receive Delivery Requests|The system shall allow the driver to receive delivery requests.|
|**FR-DRV-008**|View Delivery Details|The system shall allow the driver to view delivery request details.|
|FR-DRV-008.1|View Restaurant Information|The system shall display restaurant information for the delivery.|
|FR-DRV-008.2|View Customer Information|The system shall display customer information for the delivery.|
|FR-DRV-008.3|View Delivery Address|The system shall display the delivery destination.|
|**FR-DRV-009**|Accept or Reject Delivery Request|The system shall allow the driver to accept or reject delivery requests.|
|FR-DRV-009.1|Accept Delivery Request|The system shall allow the driver to accept a delivery request.|
|FR-DRV-009.2|Reject Delivery Request|The system shall allow the driver to reject a delivery request.|
|FR-DRV-009.3|Notify Assignment Result|The system shall notify the restaurant and customer of the assignment result.|
|**FR-DRV-010**|Navigate to Restaurant|The system shall allow the driver to navigate to the restaurant location.|
|**FR-DRV-011**|Confirm Order Pickup|The system shall allow the driver to confirm that the order has been picked up.|
|FR-DRV-011.1|Verify Pickup|The system shall verify that the correct order has been collected.|
|FR-DRV-011.2|Update Status to Picked Up|The system shall update the order status to **Picked Up**.|
|FR-DRV-011.3|Notify Customer of Pickup|The system shall notify the customer that the order has been picked up.|
|**FR-DRV-012**|Navigate to Customer|The system shall allow the driver to navigate to the customer's delivery location.|
|**FR-DRV-013**|Update Delivery Status|The system shall allow the driver to update the delivery status.|
|FR-DRV-013.1|Mark Delivery as On the Way|The system shall allow the driver to indicate that the delivery is in progress.|
|FR-DRV-013.2|Share Live Delivery Status|The system shall provide delivery status updates to the customer.|
|FR-DRV-013.3|Handle Delivery Delay|The system shall allow the driver to report delivery delays.|
|**FR-DRV-014**|Confirm Order Delivery|The system shall allow the driver to confirm successful order delivery.|
|FR-DRV-014.1|Verify Delivery Completion|The system shall verify that the order has been delivered successfully.|
|FR-DRV-014.2|Update Status to Delivered|The system shall update the order status to **Delivered**.|
|FR-DRV-014.3|Notify Customer and Restaurant|The system shall notify the customer and restaurant that the order has been delivered.|
|**FR-DRV-015**|View Delivery History|The system shall allow the driver to view completed delivery history.|
|**FR-DRV-016**|View Earnings|The system shall allow the driver to view earnings information.|
|FR-DRV-016.1|View Daily Earnings|The system shall display daily earnings.|
|FR-DRV-016.2|View Total Earnings|The system shall display total earnings for a selected period.|
|**FR-DRV-017**|View Delivery Statistics|The system shall allow the driver to view delivery performance statistics.|
|FR-DRV-017.1|View Completed Deliveries|The system shall display the total number of completed deliveries.|
|FR-DRV-017.2|View Performance Metrics|The system shall display delivery performance metrics.|
|**FR-DRV-018**|Receive Notifications|The system shall notify the driver of delivery and system events.|
|FR-DRV-018.1|Notify New Delivery Request|The system shall notify the driver of a new delivery request.|
|FR-DRV-018.2|Notify Order Cancellation|The system shall notify the driver if an assigned order is cancelled.|
|FR-DRV-018.3|Notify System Announcements|The system shall notify the driver of platform announcements and updates.|

## Delivery Driver Summary

|Category|Count|
|---|--:|
|Parent Functional Requirements|**18**|
|Child Functional Requirements|**39**|
|**Total Delivery Driver Functional Requirements**|**57**|

---

## Administrator Functional Requirements

|ID|Title|Functional Requirement|
|---|---|---|
|**FR-ADM-001**|Log In|The system shall allow the administrator to log in using valid credentials.|
|FR-ADM-001.1|Enter Login Credentials|The system shall allow the administrator to enter login credentials.|
|FR-ADM-001.2|Validate Credentials|The system shall validate the administrator's credentials.|
|FR-ADM-001.3|Grant System Access|The system shall grant access after successful authentication.|
|FR-ADM-001.4|Display Login Error|The system shall display an error message if authentication fails.|
|**FR-ADM-002**|Log Out|The system shall allow the administrator to log out securely.|
|**FR-ADM-003**|Recover Password|The system shall allow the administrator to recover a forgotten password.|
|FR-ADM-003.1|Request Password Reset|The system shall allow the administrator to request a password reset.|
|FR-ADM-003.2|Verify Administrator Identity|The system shall verify the administrator's identity before resetting the password.|
|FR-ADM-003.3|Create New Password|The system shall allow the administrator to create a new password.|
|**FR-ADM-004**|Manage Administrator Profile|The system shall allow the administrator to manage their profile information.|
|FR-ADM-004.1|View Profile|The system shall allow the administrator to view profile information.|
|FR-ADM-004.2|Update Profile|The system shall allow the administrator to update profile information.|
|FR-ADM-004.3|Change Password|The system shall allow the administrator to change their password.|
|**FR-ADM-005**|Manage Customers|The system shall allow the administrator to manage customer accounts.|
|FR-ADM-005.1|View Customer Information|The system shall allow the administrator to view customer details.|
|FR-ADM-005.2|Search Customers|The system shall allow the administrator to search for customers.|
|FR-ADM-005.3|Update Customer Information|The system shall allow the administrator to update customer information.|
|FR-ADM-005.4|Activate Customer Account|The system shall allow the administrator to activate customer accounts.|
|FR-ADM-005.5|Deactivate Customer Account|The system shall allow the administrator to deactivate customer accounts.|
|FR-ADM-005.6|Delete Customer Account|The system shall allow the administrator to delete customer accounts.|
|**FR-ADM-006**|Manage Restaurants|The system shall allow the administrator to manage restaurant accounts.|
|FR-ADM-006.1|View Restaurant Information|The system shall allow the administrator to view restaurant details.|
|FR-ADM-006.2|Approve Restaurant Registration|The system shall allow the administrator to approve restaurant registrations.|
|FR-ADM-006.3|Reject Restaurant Registration|The system shall allow the administrator to reject restaurant registrations.|
|FR-ADM-006.4|Update Restaurant Information|The system shall allow the administrator to update restaurant information.|
|FR-ADM-006.5|Activate Restaurant Account|The system shall allow the administrator to activate restaurant accounts.|
|FR-ADM-006.6|Deactivate Restaurant Account|The system shall allow the administrator to deactivate restaurant accounts.|
|FR-ADM-006.7|Delete Restaurant Account|The system shall allow the administrator to delete restaurant accounts.|
|**FR-ADM-007**|Manage Delivery Drivers|The system shall allow the administrator to manage delivery driver accounts.|
|FR-ADM-007.1|View Driver Information|The system shall allow the administrator to view driver details.|
|FR-ADM-007.2|Approve Driver Registration|The system shall allow the administrator to approve driver registrations.|
|FR-ADM-007.3|Reject Driver Registration|The system shall allow the administrator to reject driver registrations.|
|FR-ADM-007.4|Update Driver Information|The system shall allow the administrator to update driver information.|
|FR-ADM-007.5|Activate Driver Account|The system shall allow the administrator to activate driver accounts.|
|FR-ADM-007.6|Deactivate Driver Account|The system shall allow the administrator to deactivate driver accounts.|
|FR-ADM-007.7|Delete Driver Account|The system shall allow the administrator to delete driver accounts.|
|**FR-ADM-008**|Manage Food Categories|The system shall allow the administrator to manage platform food categories.|
|FR-ADM-008.1|Create Food Category|The system shall allow the administrator to create food categories.|
|FR-ADM-008.2|Update Food Category|The system shall allow the administrator to update food categories.|
|FR-ADM-008.3|Delete Food Category|The system shall allow the administrator to delete food categories.|
|**FR-ADM-009**|Monitor Orders|The system shall allow the administrator to monitor customer orders.|
|FR-ADM-009.1|View Order Details|The system shall allow the administrator to view order details.|
|FR-ADM-009.2|Search Orders|The system shall allow the administrator to search for orders.|
|FR-ADM-009.3|Filter Orders|The system shall allow the administrator to filter orders by status, date, or customer.|
|**FR-ADM-010**|Update Order Status|The system shall allow the administrator to update an order's status when required.|
|FR-ADM-010.1|Change Order Status|The system shall allow the administrator to change an order's status.|
|FR-ADM-010.2|Record Administrative Action|The system shall record all administrator changes to order status in the audit log.|
|**FR-ADM-011**|Manage Payments|The system shall allow the administrator to manage payment transactions.|
|FR-ADM-011.1|View Payment Transactions|The system shall allow the administrator to view payment records.|
|FR-ADM-011.2|Process Refund|The system shall allow the administrator to process eligible refunds.|
|FR-ADM-011.3|Verify Payment Status|The system shall allow the administrator to verify payment status.|
|**FR-ADM-012**|Manage Promotions|The system shall allow the administrator to manage platform promotions.|
|FR-ADM-012.1|Create Promotion|The system shall allow the administrator to create promotions.|
|FR-ADM-012.2|Update Promotion|The system shall allow the administrator to update promotions.|
|FR-ADM-012.3|Delete Promotion|The system shall allow the administrator to delete promotions.|
|**FR-ADM-013**|Manage Reviews|The system shall allow the administrator to manage customer reviews.|
|FR-ADM-013.1|View Reviews|The system shall allow the administrator to view customer reviews.|
|FR-ADM-013.2|Moderate Reviews|The system shall allow the administrator to moderate inappropriate reviews.|
|FR-ADM-013.3|Delete Reviews|The system shall allow the administrator to remove reviews that violate platform policies.|
|**FR-ADM-014**|Generate Reports|The system shall allow the administrator to generate system reports.|
|FR-ADM-014.1|Generate Sales Report|The system shall generate sales reports.|
|FR-ADM-014.2|Generate Order Report|The system shall generate order reports.|
|FR-ADM-014.3|Generate Customer Report|The system shall generate customer reports.|
|FR-ADM-014.4|Generate Restaurant Report|The system shall generate restaurant reports.|
|FR-ADM-014.5|Generate Driver Report|The system shall generate driver reports.|
|**FR-ADM-015**|View Dashboard|The system shall allow the administrator to view the system dashboard.|
|FR-ADM-015.1|View User Statistics|The system shall display user statistics.|
|FR-ADM-015.2|View Restaurant Statistics|The system shall display restaurant statistics.|
|FR-ADM-015.3|View Driver Statistics|The system shall display driver statistics.|
|FR-ADM-015.4|View Order Statistics|The system shall display order statistics.|
|FR-ADM-015.5|View Revenue Statistics|The system shall display revenue statistics.|
|**FR-ADM-016**|Send Notifications|The system shall allow the administrator to send notifications.|
|FR-ADM-016.1|Select Notification Recipients|The system shall allow the administrator to select notification recipients.|
|FR-ADM-016.2|Compose Notification|The system shall allow the administrator to compose notification messages.|
|FR-ADM-016.3|Send Notification|The system shall send notifications to the selected recipients.|
|**FR-ADM-017**|Manage System Settings|The system shall allow the administrator to manage system configuration settings.|
|FR-ADM-017.1|Configure Delivery Fees|The system shall allow the administrator to configure delivery fees.|
|FR-ADM-017.2|Configure Commission Rates|The system shall allow the administrator to configure commission rates.|
|FR-ADM-017.3|Manage Payment Methods|The system shall allow the administrator to enable or disable payment methods.|
|FR-ADM-017.4|Configure Platform Settings|The system shall allow the administrator to configure general platform settings.|
|**FR-ADM-018**|View Activity Logs|The system shall allow the administrator to view system activity logs.|
|FR-ADM-018.1|Search Activity Logs|The system shall allow the administrator to search activity logs.|
|FR-ADM-018.2|Filter Activity Logs|The system shall allow the administrator to filter activity logs by date, user, or action.|
|FR-ADM-018.3|View Audit Details|The system shall allow the administrator to view detailed audit records.|

## Administrator Summary

|Category|Count|
|---|--:|
|Parent Functional Requirements|**18**|
|Child Functional Requirements|**59**|
|**Total Administrator Functional Requirements**|**77**|

## Overall Project Functional Requirements Summary

|Actor|Parent FRs|Child FRs|Total FRs|
|---|--:|--:|--:|
|Customer|27|47|**74**|
|Restaurant|22|49|**71**|
|Delivery Driver|18|39|**57**|
|Administrator|18|59|**77**|
|**Grand Total**|**85**|**194**|**279**|

One small observation after putting everything together: the administrator ends up with slightly more detailed requirements than the customer. That's fairly typical in management systems because administrative functions often include approval workflows, reporting, configuration, and auditing, all of which naturally expand into more child requirements. The overall structure is well balanced for a food delivery system of this scope.

---
