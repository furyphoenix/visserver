/**
 * Created by phoenix on 15/10/27.
 */

/**
 * 网络图组件
 * @param scene
 * @param camera
 * @constructor
 */
function NetworkChart(scene, camera) {
    //网络图所在的场景
    this.scene = scene;

    //网络图的摄像机
    this.camera = camera;

    //节点的默认材质
    this.vertexMap = THREE.ImageUtils.loadTexture("./sprites/electric.png");

    //存储节点ID与边ID的图结构
    this.graph = new Graph(null);

    //存储节点ID与节点（Vertex）对象对应关系的表
    this.vertexIdMap = new buckets.Dictionary();

    //存储边ID与与边(Edge)对象对应关系的表
    this.edgeIdMap = new buckets.Dictionary();

    //存储节点与节点标签对应关系的表
    this.vertexIdLabelMap = new buckets.Dictionary();

    //所有节点(Vertex)的数组
    this.vertices = [];

    //所有连边(Edge)的数组
    this.edges = [];

    this.highlightedVertexIds = new buckets.Set();
    this.highlightedEdgeIds = new buckets.Set();
    this.highlightVertexMode = false;
    this.highlightEdgeMode = false;

    //TODO：ISOM布局参数应移入至布局类中
    this.epoch = 1;
    this.radius = 5;
    this.minRadius = 1;
    this.coolingFactor = 2.0;
    this.maxEpoch = 20000;
    this.radiusConstantTime = 100;
    this.initialAdaption = 0.9;
    this.minAdaption = 0;

    //场景的大小
    this.size = 50;

    this.focusSprite = new FocusSprite('#ffcb8c', 10);
    scene.add(this.focusSprite);
    this.hideFocus();

    //被关注的点ID
    this.focusId = null;

    document.addEventListener('mousedown', onMouseDownEvent, false);

    var self = this;

    function onMouseDownEvent(event) {
        console.log(event.button);
        switch (event.button) {
            case 0:
                console.log("left button pressed.");
                showFocusCursor(event);
                break;
            case 2:
                console.log("right key pressed");
                self.highlightSelectedNeighbours();
                break;
        }
    }

    function showFocusCursor(event) {
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        vector = vector.unproject(self.camera);

        var raycaster = new THREE.Raycaster(self.camera.position, vector.sub(self.camera.position).normalize());

        var intersects = raycaster.intersectObjects(self.vertices);

        if (intersects.length == 0) {
            self.hideFocus();
            console.log("deselect.");
            return;
        }

        var minDist = intersects[0].distance;
        var closestVertex = intersects[0].object;

        for (var ii = 1; ii < intersects.length; ii++) {
            if (intersects[ii].distance < minDist) {
                minDist = intersects[ii].distance;
                closestVertex = intersects[ii];
            }
        }

        var prevFocus = self.focusId;
        if (prevFocus != null) {
            var prevLabel = self.vertexIdLabelMap.get(prevFocus);
            if ((prevLabel != null) && (!self.highlightedVertexIds.contains(prevFocus))) {
                prevLabel.material.opacity = 0.2;
            }
        }

        self.showFocus(closestVertex.vertexId);

        var currLabel = self.vertexIdLabelMap.get(self.focusId);
        if (currLabel != null) {
            currLabel.material.opacity = 1.0;
        }

        console.log("select " + closestVertex.vertexId);
    }
}

/**
 * 高亮与选中节点的直接相连的节点
 */
NetworkChart.prototype.highlightSelectedNeighbours = function () {
    if (this.focusId != null) {
        this.addHighlightVertex(this.focusId);
        var ns = this.graph.getNeighbours(this.focusId);
        for (var ii = 0; ii < ns.length; ii++) {
            this.addHighlightVertex(ns[ii]);
        }
        console.log("total " + this.highlightedVertexIds.size() + " vertex will be highlight");
        this.highlightVertexMode = true;
        this.updateHighlight();
    } else {
        this.clearHighlight();
    }
}

/**
 * 添加需要高亮的节点
 * @param vertexId 节点ID
 */
NetworkChart.prototype.addHighlightVertex = function (vertexId) {
    this.highlightedVertexIds.add(vertexId);
}

/**
 * 添加需要高亮的边
 * @param edgeId 边ID
 */
NetworkChart.prototype.addHighlightEdge = function (edgeId) {
    this.highlightedEdgeIds.add(edgeId);
}

/**
 * 移除需要高亮的节点
 * @param vertexId 节点ID
 */
NetworkChart.prototype.removeHighlightVertex = function (vertexId) {
    this.highlightedVertexIds.remove(vertexId);
}

/**
 * 移除需要高亮的边
 * @param edgeId 边ID
 */
NetworkChart.prototype.removeHighlightEdge = function (edgeId) {
    this.highlightedEdgeIds.remove(edgeId);
}

/**
 * 生效高亮状态
 */
NetworkChart.prototype.updateHighlight = function () {
    if (!this.highlightVertexMode) {
        return;
    }

    for (var ii = 0; ii < this.vertices.length; ii++) {
        var v = this.vertices[ii];
        if (this.highlightedVertexIds.contains(v.vertexId)) {
            v.material.opacity = 1.0;
            if (this.vertexIdLabelMap.containsKey(v.vertexId)) {
                this.vertexIdLabelMap.get(v.vertexId).material.opacity = 1.0;
            }
        } else {
            v.material.opacity = 0.2;
            if (this.vertexIdLabelMap.containsKey(v.vertexId)) {
                this.vertexIdLabelMap.get(v.vertexId).material.opacity = 0.2;
            }
        }
    }

    for (var ii = 0; ii < this.edges.length; ii++) {
        var edge = this.edges[ii];
        var idA = edge.vertexA.vertexId;
        var idB = edge.vertexB.vertexId;
        if (this.highlightedVertexIds.contains(idA) && this.highlightedVertexIds.contains(idB)) {
            edge.material.opacity = 1.0;
        } else {
            edge.material.opacity = 0.2;
        }
    }
}

/**
 * 清除高亮状态
 */
NetworkChart.prototype.clearHighlight = function () {
    if (!this.highlightVertexMode) {
        return;
    }

    for (var ii = 0; ii < this.vertices.length; ii++) {
        var v = this.vertices[ii];
        v.material.opacity = 1.0;
        if (this.vertexIdLabelMap.containsKey(v.vertexId)) {
            this.vertexIdLabelMap.get(v.vertexId).material.opacity = 1.0;
        }
    }
    this.highlightedVertexIds.clear();
    for (var ii = 0; ii < this.edges.length; ii++) {
        this.edges[ii].material.opacity = 1.0;
    }
    this.highlightedEdgeIds.clear();
    this.highlightVertexMode = false;
}

/**
 * 建立一个随机网络，测试用
 * @param vcnt 节点数量
 * @param ecnt 边数量
 */
NetworkChart.prototype.initRandomNetwork = function (vcnt, ecnt) {
    var cnt = vcnt;
    for (var ii = 0; ii < cnt; ii++) {
        this.addVertex("v" + ii, null);
    }
    console.log("vertex added.");

    for (var ii = 0; ii < ecnt; ii++) {
        var idxA = THREE.Math.randInt(0, cnt - 1);
        var idxB = THREE.Math.randInt(0, cnt - 1);
        this.addEdge(idxA + "-" + idxB, null, "v" + idxA, "v" + idxB);

    }

    console.log("edges added.");

    console.log("total " + this.graph.getVertexCount() + " vertices, " + this.graph.getEdgeCount() + " edges");
    console.log("total " + this.vertices.length + " vertices, " + this.edges.length + " edges");
}

/**
 * 依据ID获取节点
 * @param id 节点ID
 * @returns {Vertex} 对应的节点Vertex对象
 */
NetworkChart.prototype.getVertexById = function (id) {
    return this.vertexIdMap.get(id);
}

/**
 * 依据ID获取边
 * @param id 边ID
 * @returns {Edge} 对应的边Edge对象
 */
NetworkChart.prototype.getEdgeById = function (id) {
    return this.edgeIdMap.get(id);
}

/**
 * 添加节点
 * @param id 节点ID
 * @param vertexData 节点中存储的用户数据，访问时可通过.userData直接获得
 */
NetworkChart.prototype.addVertex = function (id, vertexData) {
    var x = THREE.Math.randFloat(-this.size, this.size);
    var y = THREE.Math.randFloat(-this.size, this.size);
    var z = THREE.Math.randFloat(-this.size, this.size);

    var v = new Vertex(id, this.vertexMap, 0xffffff);
    v.position.set(x, y, z);
    v.userData = vertexData;
    if (this.graph.addVertex(v.vertexId)) {
        this.vertices.push(v);
        this.vertexIdMap.set(v.vertexId, v);
        this.scene.add(v);
    }
}

/**
 * 添加边
 * @param id 边ID
 * @param edgeData 边中存储的用户数据，访问时可通过访问.userData直接获得
 * @param fromId 边的起始节点的ID
 * @param toId 边的结束节点的ID
 */
NetworkChart.prototype.addEdge = function (id, edgeData, fromId, toId) {
    var edge = new Edge(id, 0xffffff, this.getVertexById(fromId), this.getVertexById(toId));
    //console.log(this.edges.length);

    edge.userData = edgeData;
    if (this.graph.addEdge(id, fromId, toId)) {
        this.edges.push(edge);

        this.edgeIdMap.set(id, edge);
        this.scene.add(edge);
    }
}

/**
 * 对图执行ISOM布局
 * @param times 执行次数
 */
NetworkChart.prototype.isomLayout = function (times) {
    //console.log(this.vertices.length+" "+this.edges.length);
    if (this.epoch > this.maxEpoch) {
        return;
    }

    var self = this;

    for (var t = 0; t < times; t++) {
        this.adaption = Math.max(this.minAdaption, Math.pow(Math.E, -1.0 * this.coolingFactor * (this.epoch / this.maxEpoch)) * this.initialAdaption);
        var randX = THREE.Math.randFloat(0, this.size);
        var randY = THREE.Math.randFloat(0, this.size);
        var randZ = THREE.Math.randFloat(0, this.size);
        var randV = new THREE.Vector3(randX, randY, randZ);
        var min = 0;


        var winner = null;
        for (var ii = 0; ii < this.vertices.length; ii++) {
            if (ii == 0) {
                min = this.vertices[0].position.distanceTo(randV);
                winner = this.vertices[0];
            } else {
                var dist = this.vertices[ii].position.distanceTo(randV);
                if (dist < min) {
                    min = dist;
                    winner = this.vertices[ii];
                }
            }
        }

        //console.log("winner found: " + winner.vertexId+":"+winner.position);

        var distMap = this.graph.getNeighbourDistanceMap(winner.vertexId, this.radius);
        distMap.keys().forEach(function (neighbourId) {
            var depth = distMap.get(neighbourId);
            if (depth <= 0) {
                return;
            }
            var neighbour = self.getVertexById(neighbourId);
            var tempx = neighbour.position.x - randV.x;
            var tempy = neighbour.position.y - randV.y;
            var tempz = neighbour.position.z - randV.z;
            var ratio = Math.pow(2, -depth) * self.adaption;
            neighbour.position.x -= (ratio * tempx);
            neighbour.position.y -= (ratio * tempy);
            neighbour.position.z -= (ratio * tempz);
        });

        this.epoch++;

        if ((Math.round(this.radius % this.radiusConstantTime) == 0) && (this.radius > this.minRadius)) {
            this.radius--;
        }
    }
    this.updatePositions();
}

/**
 * 重置ISOM布局
 */
NetworkChart.prototype.resetISOMLayout = function () {
    this.epoch = 1;
    this.radius = 50;
    this.coolingFactor = 2.0;
    this.maxEpoch = 2000;
    this.radiusConstantTime = 100;
    this.initialAdaption = 0.9;
    this.minAdaption = 0;
}

/**
 * 对应移动连边的位置，在移动节点位置后调用
 */
NetworkChart.prototype.updateEdgePostions = function () {
    for (var ii = 0; ii < this.edges.length; ii++) {
        var edge = this.edges[ii];
        var posA = edge.vertexA.position;
        var posB = edge.vertexB.position;
        edge.moveTo(posA, posB);
    }
}

/**
 * 将所有边设置为指定颜色
 * @param color 颜色
 */
NetworkChart.prototype.setAllEdgeColor = function (color) {
    for (var ii = 0; ii < this.edges.length; ii++) {
        var edge = this.edges[ii];
        edge.setEdgeColor(color);
    }
}

/**
 * 将所有节点设置为指定颜色
 * @param color
 */
NetworkChart.prototype.setAllVertexColor = function (color) {
    for (var ii = 0; ii < this.vertices.length; ii++) {
        var vertex = this.vertices[ii];
        vertex.setVertexColor(color);
    }
}

/**
 * 将图中的节点和连边依据连通性自动赋予随机颜色，其中所有直接或间接相连的节点与边都是同一个颜色
 */
NetworkChart.prototype.setColorByConnective = function () {
    var clusters = this.graph.clusterByConnective();
    for (var ii = 0; ii < clusters.length; ii++) {
        var randH = THREE.Math.randFloat(0.0, 1.0);
        var randS = THREE.Math.randFloat(0.0, 1.0);
        var randL = THREE.Math.randFloat(0.5, 1.0);
        var randColor = new THREE.Color(0xffffff);
        randColor.setHSL(randH, randS, randL);

        var cluster = clusters[ii];

        //console.log("set color "+randColor.getHex()+" for "+cluster.length+" vertex");

        for (var jj = 0; jj < cluster.length; jj++) {
            var vertexId = cluster[jj];
            var vertex = this.getVertexById(vertexId);
            vertex.setVertexColor(randColor);
            var connectedEdgeIds = this.graph.getConnectedEdges(vertexId);
            for (var kk = 0; kk < connectedEdgeIds.length; kk++) {
                var edgeId = connectedEdgeIds[kk];
                var edge = this.getEdgeById(edgeId);
                edge.setEdgeColor(randColor);
            }
        }

    }
}

/**
 * 根据ID显示指定节点的标签，标签内容即为ID
 * @param vertexId 节点ID
 */
NetworkChart.prototype.showVertexLabel = function (vertexId) {
    if (this.vertexIdLabelMap.containsKey(vertexId)) {
        return;
    }

    var vertex = this.getVertexById(vertexId);
    if (vertex == null) {
        return;
    }

    var label = this.makeTextSprite(vertex.vertexId, 9, vertex.material.color);
    label.position.set(vertex.position.x + 1, vertex.position.y, vertex.position.z);

    this.vertexIdLabelMap.set(vertexId, label);
    this.scene.add(label);
}

/**
 * 显示所有节点的标签，标签内容即为ID
 */
NetworkChart.prototype.showAllVertexLabel = function () {
    var vids = this.graph.getVertices();
    for (var ii = 0; ii < vids.length; ii++) {
        this.showVertexLabel(vids[ii]);
    }
}

/**
 * 隐藏指定节点的标签
 * @param vertexId 节点ID
 */
NetworkChart.prototype.hideVertexLabel = function (vertexId) {
    var label = this.vertexIdLabelMap.get(vertexId);
    if (label != null) {
        this.scene.remove(label);
        this.vertexIdLabelMap.remove(vertexId);
    }
}

/**
 * 隐藏所有节点的标签
 */
NetworkChart.prototype.hideAllVertexLabel = function () {
    var self = this;
    this.vertexIdLabelMap.keys().forEach(function (id) {
        label = self.vertexIdLabelMap.get(id);
        self.scene.remove(label);
    });
    this.vertexIdLabelMap.clear();
}

/**
 * 更新指定节点标签的位置，在移动节点后调用
 * @param vertexId 节点ID
 */
NetworkChart.prototype.updateVertexLabelPosition = function (vertexId) {
    var label = this.vertexIdLabelMap.get(vertexId);
    if (label == null) {
        return;
    }
    var vertex = this.getVertexById(vertexId);
    label.position.set(vertex.position.x + 1, vertex.position.y, vertex.position.z);
}

/**
 * 更新所有节点的标签位置
 */
NetworkChart.prototype.updateAllVertexLabelPositions = function () {
    var self = this;
    this.vertexIdLabelMap.keys().forEach(function (id) {
        self.updateVertexLabelPosition(id);
    });
}

/**
 * 创建一个文本对象
 * @param message 文本内容
 * @param fontsize 文字大小
 * @param color 文字颜色
 * @returns {THREE.Sprite} 文本Sprite对象
 */
NetworkChart.prototype.makeTextSprite = function (message, fontsize, color) {
    var ctx, texture, sprite, spriteMaterial,
        canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    ctx.font = fontsize + "px Arial";

    // setting canvas width/height before ctx draw, else canvas is empty
    canvas.width = ctx.measureText(message).width;
    canvas.height = fontsize * 2; // fontsize * 1.5

    // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
    ctx.font = fontsize + "px Arial";
    ctx.fillStyle = color.getStyle();
    ctx.fillText(message, 0, fontsize);

    texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter; // NearestFilter;
    texture.needsUpdate = true;

    spriteMaterial = new THREE.SpriteMaterial({map: texture});
    spriteMaterial.depthTest = true;
    spriteMaterial.blending = THREE.AdditiveBlending;
    sprite = new THREE.Sprite(spriteMaterial);
    return sprite;
}

/**
 * 在指定节点上显示选中图标
 * @param vertexId 节点ID
 */
NetworkChart.prototype.showFocus = function (vertexId) {
    var vertex = this.vertexIdMap.get(vertexId);
    if (vertex == null) {
        return;
    }

    this.focusId = vertexId;
    this.focusSprite.position.x = vertex.position.x;
    this.focusSprite.position.y = vertex.position.y;
    this.focusSprite.position.z = vertex.position.z;
    //console.log(this.focusSprite.position);
    this.focusSprite.material.opacity = 1.0;
}

/**
 * 隐藏选中图标
 */
NetworkChart.prototype.hideFocus = function () {
    this.focusSprite.material.opacity = 0.0;
    this.focusId = null;
}

/**
 * 更新选中图标位置，在可能移动节点的操作之后调用，图标会跟随移动到新位置
 */
NetworkChart.prototype.updateFocusPos = function () {
    if (this.focusId != null) {
        var vertex = this.vertexIdMap.get(this.focusId);
        this.focusSprite.position.x = vertex.position.x;
        this.focusSprite.position.y = vertex.position.y;
        this.focusSprite.position.z = vertex.position.z;
    }
}

/**
 * 在移动节点后更新相关元素的位置，包括连边、标签、选中图标。
 * 在所有节点位置更新完成后调用。
 */
NetworkChart.prototype.updatePositions = function () {
    this.updateEdgePostions();
    this.updateAllVertexLabelPositions();
    this.updateFocusPos();
}


//________________________________________________

/**
 * 用于显示当前选中节点的图标
 * @param color 图标颜色
 * @param size 图标大小
 * @constructor
 */
function FocusSprite(color, size) {
    this.focusMap = THREE.ImageUtils.loadTexture("./sprites/cross.png");
    var material = new THREE.SpriteMaterial({map: this.focusMap, color: color, fog: true});
    material.depthTest = true;
    material.blending = THREE.AdditiveBlending;
    THREE.Sprite.call(this, material);
}

FocusSprite.prototype = Object.create(THREE.Sprite.prototype);


//__________________________________________________


/**
 * 节点对象
 * @param vertexId 节点ID
 * @param map 节点材质
 * @param color 节点颜色
 */
function Vertex(vertexId, map, color) {
    this.vertexId = vertexId;
    var material = new THREE.SpriteMaterial({map: map, color: color, fog: true, transparent: true});
    material.depthTest = true;
    material.blending = THREE.AdditiveBlending;
    THREE.Sprite.call(this, material);
}

Vertex.prototype = Object.create(THREE.Sprite.prototype);

/**
 * 设置节点颜色
 * @param hex 颜色16进制
 */
Vertex.prototype.setVertexColorHex = function (hex) {
    this.material.color.setHex(hex);
}

/**
 * 设置节点颜色
 * @param color 颜色对象
 */
Vertex.prototype.setVertexColor = function (color) {
    this.material.color = color;
}

/**
 * 设置节点透明度
 * @param opacity 透明度, 0.0-1.0
 */
Vertex.prototype.setVertexOpacity = function (opacity) {
    this.material.opacity = opacity;
}

//_____________________________________________________

/**
 * 边对象
 * @param edgeId 边ID
 * @param color 边颜色
 * @param vertexA 起始节点（不是ID）
 * @param vertexB 结束节点（不是ID）
 */
function Edge(edgeId, color, vertexA, vertexB) {
    this.edgeId = edgeId;
    this.vertexA = vertexA;
    this.vertexB = vertexB;

    var material = new THREE.LineBasicMaterial({color: color, transparent: true});
    var geometry = new THREE.Geometry();
    geometry.vertices.push(vertexA.position, vertexB.position);

    THREE.Line.call(this, geometry, material);
}

Edge.prototype = Object.create(THREE.Line.prototype);

/**
 * 设置边颜色
 * @param hex 颜色16进制
 */
Edge.prototype.setEdgeColorHex = function (hex) {
    this.material.color.setHex(hex);
}

/**
 * 设置边颜色
 * @param color 颜色对象
 */
Edge.prototype.setEdgeColor = function (color) {
    this.material.color = color;
}

/**
 * 设置边透明度
 * @param opacity 透明度, 0.0-1.0
 */
Edge.prototype.setEdgeOpacity = function (opacity) {
    this.material.opacity = opacity;
}

/**
 * 将连边的起始与终止节点位置移动到指定位置
 * @param posA 起始节点位置
 * @param posB 终止节点位置
 */
Edge.prototype.moveTo = function (posA, posB) {

    this.geometry.vertices[0] = posA;
    this.geometry.vertices[1] = posB;
    this.geometry.verticesNeedUpdate = true;
}
