var tableNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {

    if (tableNumber === null) {
      this.askTableNumber();
    }

    //Get the dishes collection
    var dishes = await this.getDishes();

    //makerFound Event
    this.el.addEventListener("markerFound", () => {
      if (tableNumber !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(dishes, markerId);
      }
    });
    //markerLost Event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askTableNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "Welcome to Hunger!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your table number",
          type: "number",
          min: 1
        }
      },
      closeOnClickOutside: false,
    }).then(inputValue => {
      tableNumber = inputValue;
    });
  },

  handleMarkerFound: function (dishes, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];


    //Get the dish based on ID
    var dish = dishes.filter(dish => dish.id === markerId)[0];

    //Update UI conent VISIBILITY of AR scene(MODEL , INGREDIENTS & PRICE)
    var model = document.querySelector(`#model-${dish.id}`);
    model.setAttribute("visible", true);

    var ingredientsContainer = document.querySelector(`#main-plane-${dish.id}`);
    ingredientsContainer.setAttribute("visible", true);

    var priceplane = document.querySelector(`#price-plane-${dish.id}`);
    priceplane.setAttribute("visible", true)

    var ratingplane = document.querySelector(`#rating-plane-${dish.id}`)
    ratingplane.setAttribute("visible", false)

    var reviewplane = document.querySelector(`#review-plane-${dish.id}`)
    reviewplane.setAttribute("visible", false)

    //Check if the dish is available 
    if (dish.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: dish.dish_name.toUpperCase(),
        text: "This dish is not available today!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      //Changing Model scale to initial scale
      var model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position);
      model.setAttribute("rotation", dish.model_geometry.rotation);
      model.setAttribute("scale", dish.model_geometry.scale);

      //Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");
      if (tableNumber != null) {
        //Handling Click Events
        ratingButton.addEventListener("click", () => {
          // swal({
          //   icon: "warning",
          //   title: "Rate Dish",
          //   text: "Work In Progress"
          // });
          this.handleRatings(dish);
        });


        orderButtton.addEventListener("click", () => {
          var tNumber;
          tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
          this.handleOrder(tNumber, dish);

          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "Thanks For Order !",
            text: "Your order will serve soon on your table!",
            timer: 2000,
            buttons: false
          });
        });

        orderSummaryButtton.addEventListener("click", () => {
          this.handleOrderSummary();
        })

        payButton.addEventListener("click", () => {
          this.handlePayment();
        })
        
      }
    }
  },

  handleOrderSummary: async function () {
    var tNumber;
    tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;

    var orderSummary = await this.getOrderSummary(tNumber);

    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    var tableBodyTag = document.getElementById("bill-table-body");

    tableBodyTag.innerHTML = "";

    var currentOrders = Object.keys(orderSummary.current_orders);
    console.log(currentOrders)
    currentOrders.map(i=>{
      console.log(i)
      var tr = document.createElement("tr");

      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;
      console.log(item.innerHTML)

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      tableBodyTag.appendChild(tr)
    })

    var total_tr = document.createElement("tr")
    var td1 = document.createElement("td")
    td1.setAttribute("class", "no-line")

    var td2 = document.createElement("td")
    td2.setAttribute("class", "no-line")

    var td3 = document.createElement("td")
    td3.setAttribute("class", "no-line text-center")

    var strong_tag = document.createElement("strong")
    strong_tag.innerHTML = "Total : "
    td3.appendChild(strong_tag)

    var td4 = document.createElement("td")
    td4.setAttribute("class", "no-line text-center")
    td1.setAttribute("class", "no-line text-right")
    td4.innerHTML = "$ " + orderSummary.total_bill
    total_tr.appendChild(td1)
    total_tr.appendChild(td2)
    total_tr.appendChild(td3)
    total_tr.appendChild(td4)
    tableBodyTag.appendChild(total_tr)
  },

  handleRatings: async function(dish){
    console.log("handle ratings")
    var tNumber;
    tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
    var orderSummary = await this.getOrderSummary(tNumber)
    var currentOrders = Object.keys(orderSummary.current_orders)
    if (currentOrders.length>0 && currentOrders == dish.id) {
      document.getElementById("rating-modal-div").style.display = "flex"
      document.getElementById("rating-input").value = "0"
      document.getElementById("feedback-input").value = ""
      var saveRatingButton = document.getElementById("save-rating-button")
      saveRatingButton.addEventListener("click",()=>{
        document.getElementById("rating-modal-div").style.display = "none"
        var rating = document.getElementById("rating-input").value
        var feedback = document.getElementById("feedback-input").value

        firebase.firestore().collection("dishes").doc(dish.id).update({
          last_review : feedback,
          last_rating : rating
        }).then(()=>{
          swal({
            icon: "success",
            title: "Thanks for rating!",
            text: "We hope you liked the dish!",
            timer: 2500,
            buttons: false
          })
        })
      })
    } else {
      swal({
        icon: "warning",
        title: "Oops!",
        text: "No dish found to give ratings",
        timer: 2500,
        buttons: false
      })
    }
  },

  handlePayment: function(){
    document.getElementById("modal-div").style.display = "none"
    var tNumber;
    tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
    firebase.firestore().collection("tables").doc(tNumber).update({
      currentOrders : {},
      total_bill : 0
    }).then(()=>{
      swal({
        icon: "success",
        title: "Thanks for paying!",
        text: "We hope you enjoyed the food!",
        timer: 2500,
        buttons: false
      })
    })
  },

  getOrderSummary: async function (tNumber) {
    return await firebase.firestore().collection("tables")
    .doc(tNumber).get().then(doc=>doc.data())
  },
  handleOrder: function (tNumber, dish) {
    // Reading current table order details
    firebase
      .firestore()
      .collection("tables")
      .doc(tNumber)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][dish.id]) {
          // Increasing Current Quantity
          details["current_orders"][dish.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][dish.id]["quantity"];

          details["current_orders"][dish.id]["subtotal"] =
            currentQuantity * dish.price;
        } else {
          details["current_orders"][dish.id] = {
            item: dish.dish_name,
            price: dish.price,
            quantity: 1,
            subtotal: dish.price * 1
          };
        }

        details.total_bill += dish.price;

        //Updating db
        firebase
          .firestore()
          .collection("tables")
          .doc(doc.id)
          .update(details);
      });
  },
  //Function to get the dishes collection from db
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("dishes")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  handleMarkerLost: function () {
    //Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
