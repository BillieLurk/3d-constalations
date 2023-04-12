import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import Node from "./node";
import { Vector3 } from "three";
import { MeshLine, MeshLineMaterial } from "three.meshline";


//settings
const nodeCount = 25;

// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 0, 20);

//grid plane object
const gridHelper = new THREE.GridHelper(100, 100, 0x999999, 0xaaaaaa);
gridHelper.position.y = -1.5;

scene.add(gridHelper);

//create x nodes at random positions
const nodes = [];
for (let i = 0; i < nodeCount; i++) {
  const x = Math.random() * 6 - 3;
  const y = Math.random() * 6 - 3;
  const z = Math.random() * 6 - 3;
  const size = 0.3;
  const label = i;
  if (i % 2 == 0) {
    const node = new Node(new Vector3(x, y, z), size, "", 0xaaaaaa, 0);
    nodes.push(node);
    scene.add(node);
  } else {
    const node = new Node(new Vector3(x, y, z), size, label, 0xaaaaff, 0);
    nodes.push(node);
    scene.add(node);
  }
}
/*
//randomly connect nodes
for (let i = 0; i < 10; i++) {
    const node1 = nodes[Math.floor(Math.random() * nodes.length)];
    const node2 = nodes[Math.floor(Math.random() * nodes.length)];
    node1.connect(node2);
}
*/

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1);
pointLight.position.x = 2;
pointLight.position.y = 3;
pointLight.position.z = 4;
scene.add(pointLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 4;
scene.add(camera);

// Controls

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */

const clock = new THREE.Clock();

let points, line, mesh;
points = [];

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Helper variables
let selectedNode = null;
let selectedNodeOffset = null;

// Mouse event listeners
const onMouseMove = (event) => {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // If a node is selected, update its position
  if (selectedNode) {
    // Raycast from camera to mouse position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(selectedNode, true);

    if (intersects.length > 0) {
      // Calculate the new position of the selected node based on the ray intersection point
      const point = intersects[0].point.sub(selectedNodeOffset);
      // Check if the y-coordinate of the selected node's position is below a certain threshold
      if (point.y > -1.5) {
        selectedNode.position.copy(point);
      }
    }
  }
};

const onMouseDown = (event) => {
  // Raycast from camera to mouse position
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(nodes, true);

  if (intersects.length > 0) {
    if (intersects[0].object.type == "Mesh") {
      // Select the first node that was intersected by the ray
      selectedNode = intersects[0].object.parent;
      selectedNode.isSelected = true;

      // Calculate the offset between the ray intersection point and the center of the selected node
      selectedNodeOffset = intersects[0].point.sub(selectedNode.position);
    }
  }
};

const onMouseUp = (event) => {
  // Deselect the selected node
  selectedNode.isSelected = false;
  selectedNode = null;
};
//add keybaord event listener
window.addEventListener("keydown", (event) => {
  if (event.key == " ") {
    //turn of orbit controls
    controls.enabled = !controls.enabled;
  }
});

window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("mousedown", onMouseDown, false);
window.addEventListener("mouseup", onMouseUp, false);

const tick = () => {
  //connect the 3 nearest nodes dont connect to self or already connected nodes otherwise connect to the next nearest node
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nearestNodes = node.getNearestNodes(nodes);
    for (let j = 0; j < nearestNodes.length; j++) {
      const nearestNode = nearestNodes[j];
      if (node !== nearestNode && !node.isConnected(nearestNode)) {
        node.connect(nearestNode);
        break;
      }
    }
  }

  const elapsedTime = clock.getElapsedTime();

  nodes.forEach((node) => {
    node.tick();
  });

  // Update Orbital Controls

  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
