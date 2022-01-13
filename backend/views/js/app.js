// console.log("Imported");

// function selectYear() {
//     console.log("Change year");
//     var elt = document.getElementById('years');
//     var selectedYear = elt.value;
//     var canva = document.getElementById('fakeCanva');
//     canva.innerHTML = selectedYear;
//     console.log("Changed year to", selectedYear);
// }


// window.addEventListener( "load", function () {
//     function sendData() {
//       const XHR = new XMLHttpRequest();
  
//       const FD = new FormData( form );
  
//       // Define what happens on successful data submission
//       XHR.addEventListener( "load", function(event) {
//         alert( event.target.responseText );
//       } );
  
//       // Define what happens in case of error
//       XHR.addEventListener( "error", function( event ) {
//         alert( 'Oops! Something went wrong.' );
//       } );
  
//       // Set up our request
//       XHR.open( "GET", "https://example.com/cors.php" );
  
//       // The data sent is what the user provided in the form
//       XHR.send( FD );
//     }
  
//     const form = document.getElementById( "myForm" );
//     form.addEventListener( "submit", function ( event ) {
//       event.preventDefault();
  
//       sendData();
//     } );
// } );