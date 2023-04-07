import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Node from './node'
import { Vector3 } from 'three'
import { MeshLine, MeshLineMaterial } from 'three.meshline'

var gen = require('random-seed');

var seed = '1337';
var rand = gen.create(seed);


//globals
const groups = [];

//settings
const nodeCount = 25;

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 0, 20);


//grid plane object
const gridHelper = new THREE.GridHelper(100, 100, 0x999999, 0xaaaaaa);
gridHelper.position.y = -1.5;

scene.add(gridHelper);

//create x nodes at random positions
/*
const nodes = [];
for (let i = 0; i < nodeCount; i++) {
    const x = Math.random() * 6 - 3;
    const y = Math.random() * 6 - 3;
    const z = Math.random() * 6 - 3;
    const size = Math.random() * 0.1 + 0.1;
    const label = i;
    if (i % 2 == 0) {
        const node = new Node(new Vector3(x, y, z), size, "", 0xaaaaaa, 0);
        nodes.push(node);
        scene.add(node);
    } else {
        const node = new Node(new Vector3(x, y, z), size, label, 0xaaaaff, 0.1);
        nodes.push(node);
        scene.add(node);
    }

}*/
/*
//randomly connect nodes
for (let i = 0; i < 10; i++) {
    const node1 = nodes[Math.floor(Math.random() * nodes.length)];
    const node2 = nodes[Math.floor(Math.random() * nodes.length)];
    node1.connect(node2);
}
*/





const group2 = new THREE.Group();
//create a group of nodes with random positions using random-seed
for (let i = 0; i < 4; i++) {
    const x = rand(3);
    seed = rand(1000);
    const y = rand(8);
    seed = rand(1000);
    const z = rand(2);
    seed = rand(1000);
    const size = rand(0.1, 0.2);
    const label = i;
    const node = new Node(new Vector3(x, y, z), size, label, 0xaaaaff, 0);
    group2.add(node);

    seed = rand(1000);
}
scene.add(group2);

groups.push(group2);

//connect every in node in eash group together in the groups arrary
function connectGroups(groups) {
    groups.forEach(group => {
        group.children.forEach(node => {
            group.children.forEach(node2 => {
                if (node != node2) {
                    node.connect(node2);
                }
            });
        });
    });
}

group2.rotateX(Math.PI / 1);
group2.rotateY(Math.PI / 1);
group2.position.set(0, 1, 1);

//function to print out all the positions of the nodes in a group( in an array format)
function printGroup(group) {
    let positions = [];
    group.children.forEach(node => {
        positions.push(node.nodeObject.position.x, node.nodeObject.position.y, node.nodeObject.position.z);
    });
    console.log([...positions]);
}

printGroup(group2);

//create group from array of positions
function createGroup(positions) {
    const group = new THREE.Group();
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const size = 0.1;
        const label = i;
        const node = new Node(new Vector3(x, y, z), size, label, 0xaaaaff, 0);
        group.add(node);
    }
    scene.add(group);
    groups.push(group);
    return group;
}

createGroup([2, 5, 0, 2, 6, 0, 0, 2, 1, 0, 3, 0]).position.set(0,-3,0);




// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 10
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const clock = new THREE.Clock()


connectGroups(groups);

const tick = () => {

    //connect the 3 nearest nodes dont connect to self or already connected nodes otherwise connect to the next nearest node


    const elapsedTime = clock.getElapsedTime()

    groups.forEach(group => {
        console.log(groups);
        group.children.forEach(node => {
            node.tick();
        });
    });


    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()