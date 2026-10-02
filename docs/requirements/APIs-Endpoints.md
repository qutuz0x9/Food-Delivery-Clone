# Full APIs

Generated from `docs/api/` so it matches the spec. Paths include the `/api/v1` prefix and use `:param` for path parameters.

## Customer API

Includes the public endpoints (browsing, cities, cuisines, payment methods and public reviews) and the account verification endpoints that every kind of user shares.

| Method   | Endpoint                                               | Purpose                                  |
| -------- | ------------------------------------------------------ | ---------------------------------------- |
| `GET`    | `/api/v1/cities`                                       | List the cities the platform operates in |
| `POST`   | `/api/v1/auth/register/customer`                       | Register a customer                      |
| `POST`   | `/api/v1/auth/login/customer`                          | Log in a customer                        |
| `POST`   | `/api/v1/auth/logout/customer`                         | Log out a customer                       |
| `POST`   | `/api/v1/auth/refresh/customer`                        | Refresh a customer access token          |
| `POST`   | `/api/v1/auth/forgot-password/customer`                | Request a customer password reset        |
| `POST`   | `/api/v1/auth/reset-password/customer`                 | Reset a customer password                |
| `GET`    | `/api/v1/customers/me`                                 | View customer profile                    |
| `PATCH`  | `/api/v1/customers/me`                                 | Update customer profile                  |
| `POST`   | `/api/v1/customers/me/change-password`                 | Change customer password                 |
| `GET`    | `/api/v1/customers/me/addresses`                       | List delivery addresses                  |
| `POST`   | `/api/v1/customers/me/addresses`                       | Add a new delivery address               |
| `GET`    | `/api/v1/customers/me/addresses/:addressId`            | Get one delivery address                 |
| `PATCH`  | `/api/v1/customers/me/addresses/:addressId`            | Update one delivery address              |
| `DELETE` | `/api/v1/customers/me/addresses/:addressId`            | Delete one delivery address              |
| `GET`    | `/api/v1/restaurants`                                  | Browse, search, and filter restaurants   |
| `GET`    | `/api/v1/restaurants/:restaurantId`                    | View restaurant details                  |
| `GET`    | `/api/v1/restaurants/:restaurantId/menu`               | Browse a restaurant's menu               |
| `GET`    | `/api/v1/menu-items`                                   | Search food items                        |
| `GET`    | `/api/v1/menu-items/:menuItemId`                       | View food item details                   |
| `GET`    | `/api/v1/cart`                                         | View the cart                            |
| `DELETE` | `/api/v1/cart`                                         | Clear the cart                           |
| `POST`   | `/api/v1/cart/items`                                   | Add an item to the cart                  |
| `PATCH`  | `/api/v1/cart/items/:itemId`                           | Change a cart line                       |
| `DELETE` | `/api/v1/cart/items/:itemId`                           | Remove a line from the cart              |
| `GET`    | `/api/v1/orders`                                       | List own orders                          |
| `POST`   | `/api/v1/orders`                                       | Place an order                           |
| `GET`    | `/api/v1/orders/:orderId`                              | View an order                            |
| `GET`    | `/api/v1/orders/:orderId/status`                       | Track an order's status                  |
| `GET`    | `/api/v1/orders/:orderId/tracking`                     | Track the delivery driver                |
| `POST`   | `/api/v1/orders/:orderId/cancellation`                 | Cancel an order                          |
| `GET`    | `/api/v1/payment-methods`                              | List payment methods                     |
| `GET`    | `/api/v1/orders/:orderId/payment`                      | View an order's payment                  |
| `POST`   | `/api/v1/orders/:orderId/payment`                      | Pay for an order                         |
| `POST`   | `/api/v1/orders/:orderId/restaurant-review`            | Review the restaurant                    |
| `POST`   | `/api/v1/orders/:orderId/driver-review`                | Review the driver                        |
| `GET`    | `/api/v1/restaurants/:restaurantId/reviews`            | List a restaurant's reviews              |
| `GET`    | `/api/v1/restaurant-reviews/:reviewId`                 | View own restaurant review               |
| `PATCH`  | `/api/v1/restaurant-reviews/:reviewId`                 | Edit own restaurant review               |
| `DELETE` | `/api/v1/restaurant-reviews/:reviewId`                 | Delete own restaurant review             |
| `POST`   | `/api/v1/restaurant-reviews/:reviewId/images`          | Add a photo to a review                  |
| `DELETE` | `/api/v1/restaurant-reviews/:reviewId/images/:imageId` | Remove a photo from a review             |
| `GET`    | `/api/v1/cuisines`                                     | List cuisines                            |
| `POST`   | `/api/v1/auth/verify-email/request`                    | Send an email verification code          |
| `POST`   | `/api/v1/auth/verify-email/confirm`                    | Confirm an email verification code       |
| `POST`   | `/api/v1/auth/verify-phone/request`                    | Send a phone verification code           |
| `POST`   | `/api/v1/auth/verify-phone/confirm`                    | Confirm a phone verification code        |

## Restaurant API

| Method   | Endpoint                                                                     | Purpose                                     |
| -------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| `POST`   | `/api/v1/restaurants/auth/register`                                          | Register a restaurant                       |
| `POST`   | `/api/v1/restaurants/auth/login`                                             | Log in a restaurant                         |
| `POST`   | `/api/v1/restaurants/auth/logout`                                            | Log out a restaurant                        |
| `POST`   | `/api/v1/restaurants/auth/refresh`                                           | Refresh a restaurant access token           |
| `POST`   | `/api/v1/restaurants/auth/password-reset/request`                            | Request a restaurant password reset         |
| `POST`   | `/api/v1/restaurants/auth/password-reset/confirm`                            | Reset a restaurant password                 |
| `GET`    | `/api/v1/restaurants/me`                                                     | View own restaurant profile                 |
| `PATCH`  | `/api/v1/restaurants/me`                                                     | Update own restaurant profile               |
| `POST`   | `/api/v1/restaurants/me/logo`                                                | Upload or update restaurant logo            |
| `GET`    | `/api/v1/restaurants/me/branches`                                            | List own branches                           |
| `POST`   | `/api/v1/restaurants/me/branches`                                            | Add a branch                                |
| `GET`    | `/api/v1/restaurants/me/branches/:branchId`                                  | View one own branch                         |
| `PATCH`  | `/api/v1/restaurants/me/branches/:branchId`                                  | Update or deactivate a branch               |
| `GET`    | `/api/v1/restaurants/me/branches/:branchId/operating-hours`                  | View operating hours                        |
| `PUT`    | `/api/v1/restaurants/me/branches/:branchId/operating-hours`                  | Replace the weekly operating hours schedule |
| `PATCH`  | `/api/v1/restaurants/me/branches/:branchId/operating-hours/:operatingHourId` | Update operating hours for a specific day   |
| `PATCH`  | `/api/v1/restaurants/me/branches/:branchId/availability`                     | Change branch availability                  |
| `GET`    | `/api/v1/restaurants/me/categories`                                          | List own menu categories                    |
| `POST`   | `/api/v1/restaurants/me/categories`                                          | Create a menu category                      |
| `GET`    | `/api/v1/restaurants/me/categories/:categoryId`                              | Get one menu category                       |
| `PATCH`  | `/api/v1/restaurants/me/categories/:categoryId`                              | Update a menu category                      |
| `DELETE` | `/api/v1/restaurants/me/categories/:categoryId`                              | Delete a menu category                      |
| `GET`    | `/api/v1/restaurants/me/orders`                                              | List restaurant orders                      |
| `GET`    | `/api/v1/restaurants/me/orders/active`                                       | List active orders                          |
| `GET`    | `/api/v1/restaurants/me/orders/history`                                      | Order history                               |
| `GET`    | `/api/v1/restaurants/me/orders/:orderId`                                     | View an order                               |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/accept`                              | Accept an order                             |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/reject`                              | Reject an order                             |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/prepare`                             | Start preparing an order                    |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/ready`                               | Mark an order ready for pickup              |
| `GET`    | `/api/v1/restaurants/me/reviews`                                             | List own restaurant's reviews               |
| `GET`    | `/api/v1/restaurants/me/reviews/:reviewId`                                   | View one of the restaurant's reviews        |
| `POST`   | `/api/v1/restaurants/me/reviews/:reviewId/reply`                             | Reply to a review                           |
| `PATCH`  | `/api/v1/restaurants/me/reviews/:reviewId/reply`                             | Edit a reply                                |
| `DELETE` | `/api/v1/restaurants/me/reviews/:reviewId/reply`                             | Remove a reply                              |
| `GET`    | `/api/v1/restaurants/me/menu-items`                                          | List own menu items                         |
| `POST`   | `/api/v1/restaurants/me/menu-items`                                          | Create a menu item                          |
| `GET`    | `/api/v1/restaurants/me/menu-items/:itemId`                                  | View a menu item                            |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId`                                  | Update a menu item                          |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId`                                  | Delete a menu item                          |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId/availability`                     | Mark an item available or sold out          |
| `POST`   | `/api/v1/restaurants/me/menu-items/:itemId/images`                           | Add an image to a menu item                 |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId/images/:imageId`                  | Remove an image from a menu item            |
| `GET`    | `/api/v1/restaurants/me/menu-items/:itemId/options`                          | List an item's option groups                |
| `POST`   | `/api/v1/restaurants/me/menu-items/:itemId/options`                          | Create an option group                      |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId`                 | Update an option group                      |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId`                 | Delete an option group                      |
| `POST`   | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId/values`          | Add an option to a group                    |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId/values/:valueId` | Update an option                            |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId/values/:valueId` | Delete an option                            |
| `GET`    | `/api/v1/restaurants/me/promotions`                                          | List own promotions                         |
| `POST`   | `/api/v1/restaurants/me/promotions`                                          | Create a promotion                          |
| `GET`    | `/api/v1/restaurants/me/promotions/:promotionId`                             | View a promotion                            |
| `PATCH`  | `/api/v1/restaurants/me/promotions/:promotionId`                             | Update a promotion                          |
| `DELETE` | `/api/v1/restaurants/me/promotions/:promotionId`                             | Delete a promotion                          |
| `GET`    | `/api/v1/restaurants/me/cuisines`                                            | List own cuisine tags                       |
| `POST`   | `/api/v1/restaurants/me/cuisines`                                            | Add a cuisine tag                           |
| `PATCH`  | `/api/v1/restaurants/me/cuisines/:cuisineId`                                 | Update a cuisine tag                        |
| `DELETE` | `/api/v1/restaurants/me/cuisines/:cuisineId`                                 | Delete a cuisine tag                        |
| `POST`   | `/api/v1/restaurants/me/change-password`                                     | Change own password                         |
| `GET`    | `/api/v1/restaurants/me/dashboard`                                           | Dashboard overview                          |
| `GET`    | `/api/v1/restaurants/me/dashboard/sales`                                     | Sales statistics                            |
| `GET`    | `/api/v1/restaurants/me/dashboard/orders`                                    | Order statistics                            |

## Driver API

| Method   | Endpoint                                                  | Purpose                          |
| -------- | --------------------------------------------------------- | -------------------------------- |
| `POST`   | `/api/v1/auth/register/driver`                            | Register a driver                |
| `POST`   | `/api/v1/auth/login/driver`                               | Log in a driver                  |
| `POST`   | `/api/v1/auth/logout/driver`                              | Log out a driver                 |
| `POST`   | `/api/v1/auth/refresh/driver`                             | Refresh a driver access token    |
| `POST`   | `/api/v1/auth/forgot-password/driver`                     | Request a driver password reset  |
| `POST`   | `/api/v1/auth/reset-password/driver`                      | Reset a driver password          |
| `GET`    | `/api/v1/driver/profile`                                  | View own driver profile          |
| `PATCH`  | `/api/v1/driver/profile`                                  | Update own driver profile        |
| `POST`   | `/api/v1/driver/profile/change-password`                  | Change own password              |
| `POST`   | `/api/v1/driver/profile/image`                            | Upload or update profile picture |
| `GET`    | `/api/v1/driver/vehicles`                                 | List own vehicles                |
| `POST`   | `/api/v1/driver/vehicles`                                 | Replace the active vehicle       |
| `PATCH`  | `/api/v1/driver/vehicles/:vehicleId`                      | Update a vehicle                 |
| `GET`    | `/api/v1/driver/documents`                                | List own documents               |
| `POST`   | `/api/v1/driver/documents`                                | Upload a document                |
| `DELETE` | `/api/v1/driver/documents/:documentId`                    | Remove a document                |
| `GET`    | `/api/v1/driver/availability`                             | Get current availability         |
| `PATCH`  | `/api/v1/driver/availability`                             | Change availability              |
| `POST`   | `/api/v1/driver/location`                                 | Send current location            |
| `GET`    | `/api/v1/driver/delivery-requests`                        | List pending delivery requests   |
| `GET`    | `/api/v1/driver/delivery-requests/:offerId`               | View a delivery request          |
| `POST`   | `/api/v1/driver/delivery-requests/:offerId/accept`        | Accept a delivery request        |
| `POST`   | `/api/v1/driver/delivery-requests/:offerId/reject`        | Reject a delivery request        |
| `GET`    | `/api/v1/driver/deliveries`                               | List own deliveries              |
| `GET`    | `/api/v1/driver/deliveries/history`                       | Completed delivery history       |
| `GET`    | `/api/v1/driver/deliveries/:assignmentId`                 | View delivery details            |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/pickup`          | Confirm order pickup             |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/start`           | Start the delivery               |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/complete`        | Confirm delivery                 |
| `GET`    | `/api/v1/driver/earnings`                                 | List earnings                    |
| `GET`    | `/api/v1/driver/earnings/summary`                         | Earnings summary for a period    |
| `GET`    | `/api/v1/driver/earnings/daily`                           | Daily earnings                   |
| `GET`    | `/api/v1/driver/payouts`                                  | Payout history                   |
| `GET`    | `/api/v1/driver/payouts/:payoutId`                        | View a payout                    |
| `GET`    | `/api/v1/driver/statistics`                               | Delivery statistics              |
| `GET`    | `/api/v1/driver/reviews`                                  | View own reviews                 |
| `GET`    | `/api/v1/drivers/:driverId/reviews`                       | List a driver's reviews          |
| `GET`    | `/api/v1/driver-reviews/:reviewId`                        | View own driver review           |
| `PATCH`  | `/api/v1/driver-reviews/:reviewId`                        | Edit own driver review           |
| `DELETE` | `/api/v1/driver-reviews/:reviewId`                        | Delete own driver review         |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/cash-collection` | Confirm cash collected           |

## Administrator API

| Method   | Endpoint                                                 | Purpose                                  |
| -------- | -------------------------------------------------------- | ---------------------------------------- |
| `POST`   | `/api/v1/auth/login/admin`                               | Log in an administrator                  |
| `POST`   | `/api/v1/auth/logout/admin`                              | Log out an administrator                 |
| `POST`   | `/api/v1/auth/refresh/admin`                             | Refresh an administrator access token    |
| `POST`   | `/api/v1/auth/forgot-password/admin`                     | Request an administrator password reset  |
| `POST`   | `/api/v1/auth/reset-password/admin`                      | Reset an administrator password          |
| `GET`    | `/api/v1/admin/me`                                       | View own administrator profile           |
| `PATCH`  | `/api/v1/admin/me`                                       | Update own administrator profile         |
| `POST`   | `/api/v1/admin/me/change-password`                       | Change own password                      |
| `GET`    | `/api/v1/admin/cities`                                   | List all cities                          |
| `POST`   | `/api/v1/admin/cities`                                   | Add a city                               |
| `PATCH`  | `/api/v1/admin/cities/:cityId`                           | Update or deactivate a city              |
| `GET`    | `/api/v1/admin/customers`                                | List and search customers                |
| `GET`    | `/api/v1/admin/customers/:customerId`                    | View a customer                          |
| `PATCH`  | `/api/v1/admin/customers/:customerId`                    | Update a customer                        |
| `DELETE` | `/api/v1/admin/customers/:customerId`                    | Delete a customer                        |
| `PATCH`  | `/api/v1/admin/customers/:customerId/account-status`     | Change a customer's account status       |
| `GET`    | `/api/v1/admin/restaurants`                              | List and search restaurants              |
| `GET`    | `/api/v1/admin/restaurants/:restaurantId`                | View a restaurant                        |
| `PATCH`  | `/api/v1/admin/restaurants/:restaurantId`                | Update a restaurant                      |
| `DELETE` | `/api/v1/admin/restaurants/:restaurantId`                | Delete a restaurant                      |
| `POST`   | `/api/v1/admin/restaurants/:restaurantId/approve`        | Approve a restaurant registration        |
| `POST`   | `/api/v1/admin/restaurants/:restaurantId/reject`         | Reject a restaurant registration         |
| `PATCH`  | `/api/v1/admin/restaurants/:restaurantId/account-status` | Change a restaurant's account status     |
| `GET`    | `/api/v1/admin/drivers`                                  | List and search drivers                  |
| `GET`    | `/api/v1/admin/drivers/:driverId`                        | View a driver                            |
| `PATCH`  | `/api/v1/admin/drivers/:driverId`                        | Update a driver                          |
| `DELETE` | `/api/v1/admin/drivers/:driverId`                        | Delete a driver                          |
| `PATCH`  | `/api/v1/admin/drivers/:driverId/status`                 | Approve or deactivate a driver           |
| `PATCH`  | `/api/v1/admin/drivers/:driverId/account-status`         | Change a driver's account status         |
| `PATCH`  | `/api/v1/admin/drivers/:driverId/documents/:documentId`  | Review a driver document                 |
| `GET`    | `/api/v1/admin/orders`                                   | List, search and filter orders           |
| `GET`    | `/api/v1/admin/orders/:orderId`                          | View an order                            |
| `PATCH`  | `/api/v1/admin/orders/:orderId/status`                   | Change an order's status                 |
| `GET`    | `/api/v1/admin/payments`                                 | List payments                            |
| `GET`    | `/api/v1/admin/payments/:paymentId`                      | View a payment                           |
| `POST`   | `/api/v1/admin/payments/:paymentId/refunds`              | Refund a payment                         |
| `PATCH`  | `/api/v1/admin/payments/:paymentId/refunds/:refundId`    | Update a refund's status                 |
| `GET`    | `/api/v1/admin/restaurant-reviews`                       | List restaurant reviews                  |
| `PATCH`  | `/api/v1/admin/restaurant-reviews/:reviewId`             | Moderate a restaurant review             |
| `GET`    | `/api/v1/admin/driver-reviews`                           | List driver reviews                      |
| `PATCH`  | `/api/v1/admin/driver-reviews/:reviewId`                 | Moderate a driver review                 |
| `GET`    | `/api/v1/admin/payouts`                                  | List driver payouts                      |
| `POST`   | `/api/v1/admin/payouts`                                  | Create a driver payout                   |
| `GET`    | `/api/v1/admin/payouts/:payoutId`                        | View a payout                            |
| `PATCH`  | `/api/v1/admin/payouts/:payoutId`                        | Update a payout's status                 |
| `GET`    | `/api/v1/admin/audit-logs`                               | Search the audit log                     |
| `GET`    | `/api/v1/admin/audit-logs/:auditLogId`                   | View an audit entry                      |
| `GET`    | `/api/v1/admin/dashboard`                                | View the dashboard                       |
| `GET`    | `/api/v1/admin/reports/orders`                           | Orders report                            |
| `GET`    | `/api/v1/admin/reports/sales`                            | Sales report                             |
| `GET`    | `/api/v1/admin/admins`                                   | List administrators                      |
| `POST`   | `/api/v1/admin/admins`                                   | Create an administrator                  |
| `GET`    | `/api/v1/admin/admins/:adminId`                          | View an administrator                    |
| `DELETE` | `/api/v1/admin/admins/:adminId`                          | Delete an administrator                  |
| `PATCH`  | `/api/v1/admin/admins/:adminId/account-status`           | Change an administrator's account status |
| `GET`    | `/api/v1/admin/deliveries`                               | List deliveries                          |
| `GET`    | `/api/v1/admin/orders/:orderId/dispatch`                 | View an order's dispatch                 |
| `PUT`    | `/api/v1/admin/orders/:orderId/dispatch/assignment`      | Assign a driver to an order              |
| `POST`   | `/api/v1/admin/orders/:orderId/dispatch/offers`          | Offer an order to drivers again          |
