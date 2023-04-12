import * as THREE from "three";
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from "three.meshline";

const maxConnections = 1000;
const maxConnectionDist = 3;
const textScale = 0.002;

const bounds = Infinity;
//create a node class with three js objects
class Node extends THREE.Object3D {
  constructor(pos, size, label, color, velMult = 0.001) {
    super();
    this.connectedNodes = [];
    this.ogPos = pos;
    this.color = color || 0xaaaaaa;
    this.isSelected = false;
    this.velocity = new THREE.Vector3(
      Math.random() * 0.1 - 0.05,
      Math.random() * 0.1 - 0.05,
      Math.random() * 0.1 - 0.05
    );
    this.velocity.multiplyScalar(velMult);

    this.size = size;
    this.label = label === "" ? null : label;
    //get distance from origin

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.0,
    });
    this.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphereMesh.scale.set(size, size, size);
    this.sphereMesh.renderOrder = 1000;

    


    this.add(this.sphereMesh2);

    // Create text sprite
    if (this.label !== null) {
      const textTexture = new THREE.CanvasTexture(createTextLabel(this.label));
      const textMaterial = new THREE.SpriteMaterial({ map: textTexture });
      this.textSprite = new THREE.Sprite(textMaterial);
      this.textSprite.scale.set(
        textTexture.image.width * textScale,
        textTexture.image.height * textScale,
        1
      ); // Scale text
      this.textSprite.position.set(
        0,
        this.sphereMesh.geometry.parameters.radius - 0.5,
        0
      ); // Position text relative to sphere
    }
    // Initialize child nodes and lines array
    this.childNodes = [];
    this.lines = [];

    // Create text container object and add sphere and text to it

    this.add(this.sphereMesh);
    if (this.label !== null) {
      this.add(this.textSprite);
    }
    // Set position of container object
    this.position.copy(pos);
  }

  updateTextLabel(label) {
    this.remove(this.textSprite); // Remove old text sprite
    const textTexture = new THREE.CanvasTexture(createTextLabel(label)); // Create new canvas texture
    const newTextMaterial = new THREE.SpriteMaterial({
      map: textTexture,
      alphaTest: 0.001,
    });
    const newTextSprite = new THREE.Sprite(newTextMaterial);
    newTextSprite.scale.set(
      textTexture.image.width * textScale,
      textTexture.image.height * textScale,
      1
    ); // Scale text
    newTextSprite.position.set(
      0,
      this.sphereMesh.geometry.parameters.radius - 0.8,
      0
    ); // Position text relative to sphere
    this.add(newTextSprite); // Add new text sprite to container
    this.textSprite = newTextSprite; // Update reference to current text sprite
  }

  tick() {
    this.position.add(this.velocity);
    
    //make node spring toward ogPos and have variables for dampening and spring strength
    if (!this.isSelected) {
        const springStrength = 0.05;
        const springDampening = 0.85;
        const distance = this.ogPos.distanceTo(this.position);
        const spring = this.ogPos
          .clone()
          .sub(this.position)
          .multiplyScalar(springStrength * distance);
        this.velocity.add(spring);
        this.velocity.multiplyScalar(springDampening);
    }

    if (this.label !== null) {
      this.distance = Math.sqrt(
        this.position.x * this.position.x +
          this.position.y * this.position.y +
          this.position.z * this.position.z
      );
      this.label = this.distance.toFixed(6);
      this.updateTextLabel(this.label);
    }

    // Update lines to child nodes
    this.childNodes.forEach((childNode, index) => {
      const distance = this.position.distanceTo(childNode.position);
      this.lines[index].setPoints([
        new THREE.Vector3(0, 0, 0),
        childNode.position.clone().sub(this.position),
      ]);

      if (distance > maxConnectionDist) {
        this.disconnect(childNode);
        childNode.disconnect(this);
      }
    });

    // prevent nodes from going out of bounds
    if (this.position.x < -bounds || this.position.x > bounds) {
      this.velocity.x *= -1;
    }
    if (this.position.y < -bounds || this.position.y > bounds) {
      this.velocity.y *= -1;
    }
    if (this.position.z < -bounds || this.position.z > bounds) {
      this.velocity.z *= -1;
    }
  }

  //getNearestNodes Function with parameter of nodes array and returns the nearest nodes in order of distance
  getNearestNodes(nodes) {
    let nearestNodes = [];
    let distances = [];

    nodes.forEach((node) => {
      if (node !== this) {
        const distance = this.position.distanceTo(node.position);
        if (distance < maxConnectionDist) {
          distances.push(distance);
          nearestNodes.push(node);
        }
      }
    });

    // Sort nodes by distance
    for (const [i, distance] of distances.entries()) {
      for (const [j, _] of distances.slice(i + 1).entries()) {
        if (distances[j] < distances[j - 1]) {
          // Swap distances
          [distances[j], distances[j - 1]] = [distances[j - 1], distances[j]];
          // Swap nodes
          [nearestNodes[j], nearestNodes[j - 1]] = [
            nearestNodes[j - 1],
            nearestNodes[j],
          ];
        }
      }
    }

    return nearestNodes;
  }

  applyForce(force) {
    this.velocity.add(force);
  }

  connect(childNode) {
    if (
      !this.isConnected(childNode) &&
      !childNode.isConnected(this) &&
      this.childNodes.length < maxConnections
    ) {
      this.childNodes.push(childNode);

      const line = new MeshLine();
      line.setGeometry(
        new THREE.BufferGeometry().setFromPoints([
          this.position,
          childNode.position,
        ])
      );

      const material = new MeshLineMaterial({
        color: new THREE.Color(this.color),
        lineWidth: 0.01,
      });
      material.transparent = true;
      const mesh = new THREE.Mesh(line, material);

      this.lines.push(line);

      this.add(mesh);
    }
  }

  disconnect(childNode) {
    const index = this.childNodes.indexOf(childNode);

    if (index > -1) {
      const line = this.lines[index];
      const mesh = this.children.find(
        (child) => child.geometry === line.geometry
      );

      // Remove the line from the arrays
      this.childNodes.splice(index, 1);
      this.lines.splice(index, 1);

      // Remove the mesh from the scene
      if (mesh) {
        this.remove(mesh);
        if (line && line.material) {
          line.material.dispose();
        }
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          mesh.material.dispose();
        }
      }

      // Dispose of the line geometry
      if (line && line.geometry) {
        line.geometry.dispose();
      }
    }
  }

  isConnected(childNode) {
    return this.childNodes.includes(childNode);
  }

  getConnectedNodes() {
    return this.connectedNodes;
  }
}

export default Node;

function createTextLabel(label) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontSize = 48;
  const font = `${fontSize}px Arial`;
  context.font = font;
  const textWidth = context.measureText(label).width;
  const width = textWidth + fontSize * 8; // Add some padding to the width
  const height = fontSize * 1.5;
  canvas.width = width;
  canvas.height = height;
  context.font = font;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(21,21,21,0.8)";
  context.fillText(label, width / 2, height / 2);
  return canvas;
}
