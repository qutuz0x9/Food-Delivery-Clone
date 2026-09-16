# Full APIs

## Customer API

| Method   | Endpoint                                     | Purpose                   |
| -------- | -------------------------------------------- | ------------------------- |
| `POST`   | `/auth/register/customer`                    | Register customer account |
| `POST`   | `/auth/login`                                | Authenticate customer     |
| `POST`   | `/auth/logout`                               | Logout current session    |
| `POST`   | `/auth/password/forgot`                      | Request password reset    |
| `POST`   | `/auth/password/reset`                       | Reset password            |
| `GET`    | `/customers/me`                              | View customer profile     |
| `PATCH`  | `/customers/me`                              | Update customer profile   |
| `PATCH`  | `/customers/me/password`                     | Change password           |
| `GET`    | `/customers/me/addresses`                    | List addresses            |
| `POST`   | `/customers/me/addresses`                    | Add address               |
| `GET`    | `/customers/me/addresses/:addressId`         | Get address               |
| `PATCH`  | `/customers/me/addresses/:addressId`         | Update address            |
| `DELETE` | `/customers/me/addresses/:addressId`         | Delete address            |
| `PATCH`  | `/customers/me/addresses/:addressId/default` | Set default address       |
| `GET`    | `/restaurants`                               | Browse restaurants        |
| `GET`    | `/restaurants/search`                        | Search restaurants        |
| `GET`    | `/restaurants?filters...`                    | Filter restaurants        |
| `GET`    | `/restaurants/:restaurantId`                 | Restaurant details        |
| `GET`    | `/restaurants/:restaurantId/menu`            | Browse restaurant menu    |
| `GET`    | `/menu-items/:menuItemId`                    | Food details              |
| `GET`    | `/menu-items/search`                         | Search food items         |
| `GET`    | `/cart`                                      | View current cart         |
| `POST`   | `/cart/items`                                | Add item                  |
| `PATCH`  | `/cart/items/:itemId`                        | Change quantity           |
| `DELETE` | `/cart/items/:itemId`                        | Remove item               |
| `DELETE` | `/cart`                                      | Clear cart                |
| `POST`   | `/orders`                                    | Place order               |
| `GET`    | `/orders`                                    | Order history             |
| `GET`    | `/orders/:orderId`                           | View order details        |
| `GET`    | `/orders/:orderId/status`                    | Track order               |
| `POST`   | `/orders/:orderId/cancellation`              | Request cancellation      |
| `GET`    | `/payment-methods`                           | Available payment methods |
| `POST`   | `/orders/:orderId/payment`                   | Process payment           |
| `GET`    | `/orders/:orderId/payment`                   | Payment status            |
| `POST`   | `/orders/:orderId/restaurant-review`         | Submit restaurant review  |
| `GET`    | `/restaurants/:restaurantId/reviews`         | View restaurant reviews   |
| `GET`    | `/restaurant-reviews/:reviewId`              | View review               |
| `PATCH`  | `/restaurant-reviews/:reviewId`              | Edit review               |
| `DELETE` | `/restaurant-reviews/:reviewId`              | Delete own review         |
| `POST`   | `/restaurant-reviews/:reviewId/images`       | Add review image          |
| `POST`   | `/orders/:orderId/driver-review`             | Rate driver               |
| `GET`    | `/drivers/:driverId/reviews`                 | View driver reviews       |
| `GET`    | `/driver-reviews/:reviewId`                  | View review               |
| `PATCH`  | `/driver-reviews/:reviewId`                  | Edit own review           |
| `DELETE` | `/driver-reviews/:reviewId`                  | Delete own review         |

## Restaurant API

| Method   | Endpoint                                                                     | Purpose                |
| -------- | ---------------------------------------------------------------------------- | ---------------------- |
| `POST`   | `/api/v1/restaurants/auth/register`                                          | Register restaurant    |
| `POST`   | `/api/v1/restaurants/auth/login`                                             | Login                  |
| `POST`   | `/api/v1/restaurants/auth/logout`                                            | Logout                 |
| `POST`   | `/api/v1/restaurants/auth/password-reset/request`                            | Request password reset |
| `POST`   | `/api/v1/restaurants/auth/password-reset/confirm`                            | Reset password         |
| `GET`    | `/api/v1/restaurants/me`                                                     | View own profile       |
| `PATCH`  | `/api/v1/restaurants/me`                                                     | Update profile         |
| `POST`   | `/api/v1/restaurants/me/logo`                                                | Upload/update logo     |
| `GET`    | `/api/v1/restaurants/me/operating-hours`                                     | View operating hours   |
| `PUT`    | `/api/v1/restaurants/me/operating-hours`                                     | Replace schedule       |
| `PATCH`  | `/api/v1/restaurants/me/operating-hours/:id`                                 | Update specific day    |
| `PATCH`  | `/api/v1/restaurants/me/availability`                                        | Change availability    |
| `GET`    | `/api/v1/restaurants/me/categories`                                          | List categories        |
| `POST`   | `/api/v1/restaurants/me/categories`                                          | Create category        |
| `GET`    | `/api/v1/restaurants/me/categories/:categoryId`                              | Get category           |
| `PATCH`  | `/api/v1/restaurants/me/categories/:categoryId`                              | Update category        |
| `DELETE` | `/api/v1/restaurants/me/categories/:categoryId`                              | Delete category        |
| `GET`    | `/api/v1/restaurants/me/menu-items`                                          | List menu items        |
| `POST`   | `/api/v1/restaurants/me/menu-items`                                          | Create item            |
| `GET`    | `/api/v1/restaurants/me/menu-items/:itemId`                                  | Get item               |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId`                                  | Update item            |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId`                                  | Delete item            |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId/availability`                     | Change availability    |
| `POST`   | `/api/v1/restaurants/me/menu-items/:itemId/images`                           | Upload image           |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId/images/:imageId`                  | Remove image           |
| `GET`    | `/api/v1/restaurants/me/menu-items/:itemId/options`                          | List option groups     |
| `POST`   | `/api/v1/restaurants/me/menu-items/:itemId/options`                          | Create option group    |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId`                 | Update group           |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId`                 | Delete group           |
| `POST`   | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId/values`          | Add option             |
| `PATCH`  | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId/values/:valueId` | Update option          |
| `DELETE` | `/api/v1/restaurants/me/menu-items/:itemId/options/:groupId/values/:valueId` | Delete option          |
| `GET`    | `/api/v1/restaurants/me/orders`                                              | List restaurant orders |
| `GET`    | `/api/v1/restaurants/me/orders/:orderId`                                     | View order details     |
| `GET`    | `/api/v1/restaurants/me/orders/active`                                       | Active orders          |
| `GET`    | `/api/v1/restaurants/me/orders/history`                                      | Order history          |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/accept`                              | Accept order           |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/reject`                              | Reject order           |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/prepare`                             | Start preparation      |
| `POST`   | `/api/v1/restaurants/me/orders/:orderId/ready`                               | Ready for pickup       |
| `GET`    | `/api/v1/restaurants/me/promotions`                                          | List promotions        |
| `POST`   | `/api/v1/restaurants/me/promotions`                                          | Create promotion       |
| `GET`    | `/api/v1/restaurants/me/promotions/:promotionId`                             | Get promotion          |
| `PATCH`  | `/api/v1/restaurants/me/promotions/:promotionId`                             | Update promotion       |
| `DELETE` | `/api/v1/restaurants/me/promotions/:promotionId`                             | Delete promotion       |
| `GET`    | `/api/v1/restaurants/me/reviews`                                             | View reviews           |
| `GET`    | `/api/v1/restaurants/me/reviews/:reviewId`                                   | View specific review   |
| `POST`   | `/api/v1/restaurants/me/reviews/:reviewId/reply`                             | Respond to review      |
| `GET`    | `/api/v1/restaurants/me/dashboard`                                           | Dashboard overview     |
| `GET`    | `/api/v1/restaurants/me/dashboard/sales`                                     | Sales statistics       |
| `GET`    | `/api/v1/restaurants/me/dashboard/orders`                                    | Order statistics       |
| `GET`    | `/api/v1/restaurants/me/dashboard/revenue`                                   | Revenue report         |

## Driver API

| Method   | Endpoint                                                        | Purpose                        |
| -------- | --------------------------------------------------------------- | ------------------------------ |
| `POST`   | `/api/v1/auth/driver/register`                                  | Register driver                |
| `POST`   | `/api/v1/auth/login`                                            | Driver login                   |
| `POST`   | `/api/v1/auth/logout`                                           | Logout                         |
| `POST`   | `/api/v1/auth/password/forgot`                                  | Request password reset         |
| `POST`   | `/api/v1/auth/password/reset`                                   | Reset password                 |
| `GET`    | `/api/v1/driver/profile`                                        | View driver profile            |
| `PATCH`  | `/api/v1/driver/profile`                                        | Update profile                 |
| `PATCH`  | `/api/v1/driver/profile/vehicle`                                | Update vehicle information     |
| `POST`   | `/api/v1/driver/profile/image`                                  | Upload profile picture         |
| `GET`    | `/api/v1/driver/documents`                                      | View driver documents          |
| `POST`   | `/api/v1/driver/documents`                                      | Upload document                |
| `DELETE` | `/api/v1/driver/documents/:documentId`                          | Remove document                |
| `GET`    | `/api/v1/driver/availability`                                   | Get current availability       |
| `PATCH`  | `/api/v1/driver/availability`                                   | Change availability            |
| `GET`    | `/api/v1/driver/deliveries/requests`                            | List pending delivery requests |
| `GET`    | `/api/v1/driver/deliveries/:assignmentId`                       | View delivery details          |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/accept`                | Accept delivery                |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/reject`                | Reject delivery                |
| `GET`    | `/api/v1/driver/deliveries/:assignmentId/navigation/restaurant` | Get restaurant navigation data |
| `GET`    | `/api/v1/driver/deliveries/:assignmentId/navigation/customer`   | Get customer navigation data   |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/pickup`                | Confirm pickup                 |
| `GET`    | `/api/v1/driver/deliveries/:assignmentId/pickup/verify`         | Verify pickup information      |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/start`                 | Start delivery                 |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/delay`                 | Report delay                   |
| `POST`   | `/api/v1/driver/deliveries/:assignmentId/complete`              | Confirm delivery               |
| `POST`   | `/api/v1/driver/location`                                       | Send current location          |
| `GET`    | `/api/v1/driver/deliveries/:assignmentId/location`              | Get driver's delivery location |
| `GET`    | `/api/v1/driver/deliveries`                                     | List driver's deliveries       |
| `GET`    | `/api/v1/driver/deliveries/history`                             | Completed delivery history     |
| `GET`    | `/api/v1/driver/earnings`                                       | Earnings summary               |
| `GET`    | `/api/v1/driver/earnings/daily`                                 | Daily earnings                 |
| `GET`    | `/api/v1/driver/earnings/summary`                               | Period earnings                |
| `GET`    | `/api/v1/driver/earnings/payouts`                               | Payout history                 |
| `GET`    | `/api/v1/driver/statistics`                                     | Driver statistics              |
| `GET`    | `/api/v1/driver/statistics/deliveries`                          | Completed deliveries           |
| `GET`    | `/api/v1/driver/statistics/performance`                         | Performance metrics            |
