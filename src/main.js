import {
    PerspectiveCamera,
    Mesh,
    MeshBasicMaterial,
    BoxGeometry,
    WebGLRenderer,
    Scene,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    Group,
    Box3,
  } from "../vendor/three/build/three.module.js";
  
import { OrbitControls } from "../vendor/three/examples/jsm/controls/OrbitControls.js";

const borderWidth = 2;
const HEIGHT = 1;
const renderer = new WebGLRenderer();

window.addEventListener( 'resize', onWindowResize, false );

renderer.setSize( window.innerWidth, window.innerHeight );
function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

document.body.appendChild( renderer.domElement );

const scene = new Scene();
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
const controls = new OrbitControls( camera, renderer.domElement );

var activityGroup = new Group();
var dayPlaceholderGroup = new Group();

// var axesHelper = new AxesHelper( 5 );
// scene.add( axesHelper );

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set( 7/2, 20, 50 );
controls.update();

function createBottom(tiles) {
    let bbox = new Box3().setFromObject(tiles);
 
    console.log(bbox.min, bbox.max);
    const materialWhite = new MeshBasicMaterial( { color: 0xa6a6a6 } );
    const width = (bbox.max.x - bbox.min.x) + borderWidth;
    const length = (bbox.max.z - bbox.min.z) + borderWidth;

    const bottomGeometry = new BoxGeometry(width, HEIGHT, length);
    let center = new Mesh( bottomGeometry, materialWhite);
    center.position.set((Math.abs(bbox.max.x) - Math.abs(bbox.min.x)) / 2, 0, (Math.abs(bbox.max.z) - Math.abs(bbox.min.z)) / 2);

    scene.add( center );

    var geo = new EdgesGeometry( center.geometry );
    var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
    var wireframe = new LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    center.add( wireframe );
}

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

	renderer.render( scene, camera );

}

function getPositionFromDay(day) {
    let dayOfWeek = day.getDay();
    let dayOfWeekOffset = ((dayOfWeek + 6) % 7)

    var position = {x: dayOfWeekOffset, y: 0};

    // Week number
    // Check if the year started with a rest a past year week
    let oneJan = new Date(day.getFullYear(), 0, 1);
    let firstWeek = oneJan.getWeekNumber();
    let weekNumbers = day.getWeekNumber();
    if (firstWeek[0] == day.getFullYear() - 1)
    {
        // Add 1 week for the last week of past year
        if (day.getWeekNumber()[0] != day.getFullYear()){
            position.y = 1
        }
        else {
            position.y = weekNumbers[1]+1
        }
    } 
    else {
        if (weekNumbers[0] == day.getFullYear()){
            position.y = weekNumbers[1];
        }
        else if (weekNumbers[0] == day.getFullYear() + 1){
            position.y = day.getNumberOfWeeks();

        }
    }
    return position;
}

function addDayPlaceholder(day) {
    const geometry = new BoxGeometry(1, 0.1, 1);
    const placeholderMaterial = new MeshBasicMaterial( { color: 0x707070 } );
    var cube = new Mesh( geometry, placeholderMaterial );
    let position = getPositionFromDay(day);
    cube.position.set(position.x, 0.5, position.y);
    dayPlaceholderGroup.add( cube );

    var geo = new EdgesGeometry( cube.geometry );
    var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
    var wireframe = new LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    cube.add( wireframe );
}

function populateActivities(activities, year) {
    const materialRed = new MeshBasicMaterial( { color: 0xff0000 } );
    const debugMaterial = new MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
    const debugMaterial2 = new MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );

    activities.forEach( function(activity) {
        const activityDate = new Date(activity.start_date);
        const oneJan = new Date(activityDate.getFullYear(), 0, 1);

        let numberOfDays = Math.floor((activityDate - oneJan) / (24 * 60 * 60 * 1000));
        let weekNumber = Math.ceil(( activityDate.getDay() + 1 + numberOfDays) / 7);
        let dayOfWeek = activityDate.getDay();

        // Create block
        const height = activity.distance / 10000; // 10km = 1unit
        const geometry = new BoxGeometry(0.9, height, 0.9);
        var cube = new Mesh( geometry, materialRed );
        cube.position.set(dayOfWeek , height/2, weekNumber);
        activityGroup.add( cube );

        var geo = new EdgesGeometry( cube.geometry );
        var mat = new LineBasicMaterial( { color: 0x000000, linewidth: 10 } );
        var wireframe = new LineSegments( geo, mat );
        wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
        cube.add( wireframe );

    })

    console.log(year.getNumberOfWeeks())
    activityGroup.position.set(-(7/2) + 0.5, 0, -58/2 +0.5)

    scene.add(activityGroup);
}

function sortActivityPerYear(activities, targetYear) {
    let sortedActivities = new Array();
    activities.forEach(function(activity) {
        const activityDate = new Date(activity.start_date)
        if (activityDate.getFullYear() == targetYear.getFullYear()) {
            sortedActivities.push(activity);
        }
    })
    return sortedActivities;
}

function showActivityPlaceholder(year) {
    let start = new Date(year.getFullYear(), 0, 1)  // 1 Jan
    let stop = new Date(year.getFullYear(), 11, 31)  // 31 Dec

    for (var d = start; d <= stop; d.setDate(d.getDate() + 1)) {
        addDayPlaceholder(new Date(d));
    }
    scene.add(dayPlaceholderGroup);
    dayPlaceholderGroup.position.set(-(7/2) + 0.5, 0, -58/2 +0.5)
}


function display() {
    let year = new Date("2021");
    let requestURL = 'data/activities.json';
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        let activities = request.response;
        let sortedActivities = sortActivityPerYear(activities, year);
        showActivityPlaceholder(year);
        populateActivities(sortedActivities, year);
        createBottom(dayPlaceholderGroup);
      }

}

Date.prototype.getNumberOfWeeks = function() {
    let oneJan = new Date(this.getFullYear(),0,1);
    let lastDec = new Date(this.getFullYear(), 11, 31);
    let numberOfDays = Math.floor((lastDec - oneJan) / (24 * 60 * 60 * 1000));
    let numberOfWeeks = Math.ceil(( oneJan.getDay() + 1 + numberOfDays) / 7);
    return numberOfWeeks;
}


Date.prototype.getWeekNumber = function() {
    let d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return [d.getUTCFullYear(), weekNo];
}

animate();
display();
