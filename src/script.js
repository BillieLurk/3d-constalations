import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Node from './node'
import { Vector3 } from 'three'
import { MeshLine, MeshLineMaterial } from 'three.meshline'

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

let points, line, mesh;
points = [];



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

    const elapsedTime = clock.getElapsedTime()

    nodes.forEach(node => {
        node.tick();
    });

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()