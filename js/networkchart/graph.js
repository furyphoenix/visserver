/**
 * Created by phoenix on 15/10/23.
 * 稀疏有向图数据结构。
 * 该数据结构具有如下限制：
 * （1）所有的节点与连边均不可重复
 * （2）为从起始节点到结束节点最多仅能有一条连边
 */

/**
 * 有向图
 * @param options
 * @constructor
 */
function Graph(options){
    /**
     * 节点与节点连接信息的哈希表
     * 其中节点连接信息为连入信息与连出信息的对Pair
     * 联入信息表示为连入节点与连入边的哈希表Map<V,E>
     * 连出信息表示为连出节点与连出边的哈希表Map<V,E>
     * 整体数据结构为Map<V,Pair<Map<V,E>>>
     * @type {buckets.Dictionary}
     */
    this.vertices=new buckets.Dictionary();

    /**
     * 连边与端点信息的哈希表
     * 其中端点信息为起始节点与终止节点对Pair
     * 整体数据结构为Map<E,Pair<V>>
     * @type {buckets.Dictionary}
     */
    this.edges=new buckets.Dictionary();
}

/**
 * 获取节点数量
 * @returns {Number} 节点数量
 */
Graph.prototype.getVertexCount=function(){
    return this.vertices.size();
}

/**
 * 获取边数量
 * @returns {Number} 边数量
 */
Graph.prototype.getEdgeCount=function(){
    return this.edges.size();
}


/**
 * 列出所有节点
 * @returns {Array|*} 节点数组
 */
Graph.prototype.getVertices=function(){
    return this.vertices.keys();
}

/**
 * 列出所有边
 * @returns {Array|*} 边数组
 */
Graph.prototype.getEdges=function(){
    return this.edges.keys();
}

/**
 * 检查图中是否包含指定节点
 * @param vertex 指定节点
 * @returns {boolean} 是否包含
 */
Graph.prototype.containsVertex=function(vertex){
    return this.vertices.containsKey(vertex);
}

/**
 * 检查图中是否包含指定边
 * @param edge 指定边
 * @returns {boolean} 是否包含
 */
Graph.prototype.containsEdge=function(edge){
    return this.edges.containsKey(edge);
}

/**
 * 向图中增加节点
 * @param vertex 节点
 * @returns {boolean} 是否添加成功。若图中已存在该节点，添加失败。
 */
Graph.prototype.addVertex=function(vertex){

    if(!this.containsVertex(vertex)){
        var inOut=new Pair(new buckets.Dictionary(), new buckets.Dictionary());
        this.vertices.set(vertex, inOut);
        return true;
    }

    return false;
}

/**
 * 向图中增加边
 * @param edge 边
 * @param from 起始节点
 * @param to 结束节点
 * @returns {boolean} 是否添加成功。若图中已存在该边，添加失败
 */
Graph.prototype.addEdge=function(edge, from, to){
    /*if(from == to){
        return false;
    }*/
    if(!this.containsVertex(from)){
        this.addVertex(from);
        console.log("add  vertex "+from);
    }
    if(!this.containsVertex(to)){
        this.addVertex(to);
        console.log("add  vertex "+to);
    }

    if(this.hasEdge(from, to)){
        return false;
    }

    var pair=new Pair(from, to);
    this.edges.set(edge, pair);

    this.vertices.get(from).getSecond().set(to, edge);
    this.vertices.get(to).getFirst().set(from, edge);

    return true;
}

/**
 * 移除指定节点
 * @param vertex 指定节点
 * @returns {boolean} 是否移除成功。若图中不存在该节点，移除失败
 */
Graph.prototype.removeVertex=function(vertex){
    if(this.containsVertex(vertex)){
        var earray=this.getConnectedEdges(vertex);
        for(var ii=0; ii<earray.length; ii++){
            this.removeEdge(earray[ii]);
        }
        this.vertices.remove(vertex);
    }

    return false;
}

/**
 * 移除指定边
 * @param edge 指定边
 * @returns {boolean} 是否移除成功。若图中不存在该连边，移除失败
 */
Graph.prototype.removeEdge=function(edge){
    if(this.containsEdge(edge)){
        var from=this.getFromPoint(edge);
        var to=this.getToPoint(edge);

        this.vertices.get(from).getSecond().remove(to);
        this.vertices.get(to).getFirst().remove(from);

        this.edges.remove(edge);

        return true;
    }

    return false;
}

/**
 * 移除指定边，并移除边上的所有端点
 * @param edge 指定连边
 * @returns {boolean} 是否操作成功。若图中不包含该连边，则返回false, 否则返回true
 */
Graph.prototype.removeEdgeWithEndPoints=function(edge){
    if(this.containsEdge(edge)){
        var from=this.getFromPoint(edge);
        var to=this.getToPoint(edge);
        this.removeEdge(edge);
        this.removeVertex(from);
        this.removeVertex(to);

        return true;
    }

    return false;
}

/**
 * 查找两个节点之间的所有连边
 * @param from 起始节点
 * @param to 结束节点
 * @param directed 是否限制方向
 * @returns {Array} 连边数组
 */
Graph.prototype.findEdgeSet=function(from, to, directed){
    var edgeSet=new Array();
    if((this.containsVertex(from))&&(this.containsVertex(to))){
        if(this.vertices.get(from).getSecond().containsKey(to)){
            edgeSet.push(this.vertices.get(from).getSecond().get(to));
        }

        if(directed==false){
            if(this.vertices.get(to).getSecond().containsKey(from)){
                edgeSet.push(this.vertices.get(to).getSecond().get(from));
            }
        }
    }

    return edgeSet;
}

/**
 * 查找从起始节点指向结束节点的连边
 * @param from 起始节点
 * @param to 结束节点
 * @returns {*} 若存在，返回连边；否则返回null
 */
Graph.prototype.findEdge=function(from, to){
    if((this.containsVertex(from))&&(this.containsVertex(to))){
        if(this.vertices.get(from).getSecond().containsKey(to)){
            return this.vertices.get(from).getSecond().get(to);
        }
    }
    return null;
}

/**
 * 判断是否存在从起始节点指向结束节点的连边
 * @param from 起始节点
 * @param to 结束节点
 * @returns {boolean} 是否存在
 */
Graph.prototype.hasEdge=function(from, to){
    if((this.containsVertex(from))&&(this.containsVertex(to))){
        if(this.vertices.get(from).getSecond().containsKey(to)){
            return true;
        }
    }
    return false;
}

/**
 * 获取节点度指标
 * @param vertex 指定节点
 * @returns {Number} 度
 */
Graph.prototype.degree=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getFirst().size()+this.vertices.get(vertex).getSecond().size();
    }
    return 0;
}

/**
 * 获取节点入度指标
 * @param vertex 指定节点
 * @returns {Number} 入度
 */
Graph.prototype.inDegree=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getFirst().size();
    }
    return 0;
}

/**
 * 获取节点出度指标
 * @param vertex 指定节点
 * @returns {*} 出度
 */
Graph.prototype.outDegree=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getSecond().size();
    }
    return 0;
}

/**
 * 获取与指定节点相邻的节点
 * @param vertex 指定节点
 * @returns {Array} 相邻节点数组
 */
Graph.prototype.getNeighbours=function(vertex){
    var vset=new buckets.Set();

    var ancestor=this.getAncestors(vertex);
    var descendant=this.getDescendants(vertex);

    for(var ii=0; ii<ancestor.length; ii++){
        vset.add(ancestor[ii]);
    }

    for(var ii=0; ii<descendant.length; ii++){

        vset.add(descendant[ii]);
    }

    return vset.toArray();
}

/**
 * 获取与指定节点指定层次以内的所有节点以及层次
 * @param vertex 指定节点
 * @param maxDepth 最大链接层次（最短路径）
 * @returns {buckets.Dictionary} 节点与连接层次的对应表
 */
Graph.prototype.getNeighbourDistanceMap=function(vertex, maxDepth){
    var map=new buckets.Dictionary();
    if(!this.containsVertex(vertex)){
        return map;
    }

    var self=this;

    map.set(vertex, 0);
    var prevV=new buckets.Set();
    prevV.add(vertex);

    for(var depth=0; depth<maxDepth; depth++){
        var currV=new buckets.Set();
        prevV.forEach(function(v){
            var neighbours=self.getNeighbours(v);
            for(var ii=0; ii<neighbours.length; ii++){
                var neighbour=neighbours[ii];
                if(!map.containsKey(neighbour)){
                    map.set(neighbour, depth);
                    currV.add(neighbour);
                }
            }
        });
        prevV.clear();
        currV.forEach(function(v){prevV.add(v)});
    }

    return map;
}

/**
 * 获取与指定节点相邻所有节点以及层次
 * @param vertex 指定节点
 * @returns {buckets.Dictionary} 节点与连接层次的对应表
 */
Graph.prototype.getAllNeighbourDistanceMap=function(vertex){
    var map=new buckets.Dictionary();
    if(!this.containsVertex(vertex)){
        return map;
    }

    var self=this;

    map.set(vertex, 0);
    var prevV=new buckets.Set();
    prevV.add(vertex);

    while(prevV.size>0){
        var currV=new buckets.Set();
        prevV.forEach(function(v){
            var neighbours=self.getNeighbours(v);
            for(var ii=0; ii<neighbours.length; ii++){
                var neighbour=neighbours[ii];
                if(!map.containsKey(neighbour)){
                    map.set(neighbour, depth);
                    currV.add(neighbour);
                }
            }
        });
        prevV.clear();
        currV.forEach(function(v){prevV.add(v)});
    }

    return map;
}

/**
 * 获取与指定节点相邻的指定深度内的所有节点
 * @param vertex 指定节点
 * @param depth 查找深度
 * @returns {*} 所有相邻节点数组
 */
Graph.prototype.getNeighboursInDepth=function(vertex, depth){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);

    for(var ii=0; ii<depth; ii++){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var neighbours=self.getNeighbours(v);

            for(var kk=0; kk<neighbours.length; kk++){
                var neighbour=neighbours[kk];
                if(!allV.contains(neighbour)){
                    currV.add(neighbour);
                    allV.add(neighbour);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return allV.toArray();
}

/**
 * 获取指定节点指定深度内的所有相邻点
 * @param vertex 指定节点
 * @param depth 指定相邻点
 * @returns {*} 相邻点数组
 */
Graph.prototype.getNeighboursWithDepth=function(vertex, depth){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);

    for(var ii=0; ii<depth; ii++){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var neighbours=self.getNeighbours(v);

            for(var kk=0; kk<neighbours.length; kk++){
                var neighbour=neighbours[kk];
                if(!allV.contains(neighbour)){
                    currV.add(neighbour);
                    allV.add(neighbour);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return prevV.toArray();
}

/**
 * 获取指定节点所有直接或间接相连的节点（连通子图）
 * @param vertex 指定节点
 * @returns {*} 相邻节点的数组
 */
Graph.prototype.getAllNeighbours=function(vertex){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    allV.add(vertex);

    while(true){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){
            var neighbours=self.getNeighbours(v);
            for(var kk=0; kk<neighbours.length; kk++){
                var neighbour=neighbours[kk];
                if(!allV.contains(neighbour)){
                    currV.add(neighbour);
                    allV.add(neighbour);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return allV.toArray();
}

/**
 * 获取指定节点的祖先
 * @param vertex 指定节点
 * @returns {*} 祖先节点数组
 */
Graph.prototype.getAncestors=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getFirst().keys();
    }
    return new Array();
}

/**
 * 获取指定节点的指定深度内的所有祖先
 * @param vertex 指定节点
 * @param depth 深度
 * @returns {*} 所有祖先节点数组
 */
Graph.prototype.getAncestorsInDepth=function(vertex, depth){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    //allV.add(vertex);
    for(var ii=0; ii<depth; ii++){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var ancestors=self.getAncestors(v);

            for(var kk=0; kk<ancestors.length; kk++){
                var ancestor=ancestors[kk];
                if(!allV.contains(ancestor)){
                    currV.add(ancestor);
                    allV.add(ancestor);

                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return allV.toArray();
}

/**
 * 获取指定节点的所有祖先
 * @param vertex 指定节点
 * @returns {*} 祖先节点的数组
 */
Graph.prototype.getAllAncestors=function(vertex){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    //allV.add(vertex);
    while(true){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var ancestors=self.getAncestors(v);

            for(var kk=0; kk<ancestors.length; kk++){
                var ancestor=ancestors[kk];
                if(!allV.contains(ancestor)){
                    currV.add(ancestor);
                    allV.add(ancestor);

                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return allV.toArray();
}


/**
 * 获取指定节点指定深度的祖先
 * @param vertex 指定节点
 * @param depth 指定深度
 * @returns {*}
 */
Graph.prototype.getAncestorsWithDepth=function(vertex, depth){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    //allV.add(vertex);
    for(var ii=0; ii<depth; ii++){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var ancestors=self.getAncestors(v);

            for(var kk=0; kk<ancestors.length; kk++){
                var ancestor=ancestors[kk];
                if(!allV.contains(ancestor)){
                    currV.add(ancestor);
                    allV.add(ancestor);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return prevV.toArray();
}

/**
 * 获取指定节点的后代
 * @param vertex 指定节点
 * @returns {*} 后代节点数组
 */
Graph.prototype.getDescendants=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getSecond().keys();
    }
    return new Array();
}

// TODO
/*Graph.prototype.getDescendantGraph=function(vertex){
    var newGraph=new Graph(null);

    if(this.containsVertex(vertex)){
        newGraph.addVertex(vertex);

        var outEdgeSet=new buckets.Set();
        while(true){
            var outEdges=this.getOutEdges(vertex);
            for(var edge in outEdges){
                if(!newGraph.containsEdge(edge)){
                    var from=graph.getFromPoint(edge);
                    var to=graph.getToPoint(edge);
                    newGraph.addEdge(edge, from, to);
                    outEdgeSet.add(edge);
                }

            }


        }
    }
}*/

/**
 * 获取指定节点的指定深度内的所有后代
 * @param vertex 指定节点
 * @param depth 指定深度
 * @returns {*} 所有后代节点数组
 */
Graph.prototype.getDescendantsInDepth= function (vertex, depth) {
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    //allV.add(vertex);
    for(var ii=0; ii<depth; ii++){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var descendants=self.getDescendants(v);

            for(var kk=0; kk<descendants.length; kk++){
                var descendant=descendants[kk];
                if(!allV.contains(descendant)){
                    currV.add(descendant);
                    allV.add(descendant);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return allV.toArray();
}

/**
 * 获取指定节点的后代节点
 * @param vertex 指定节点
 * @returns {*} 后代节点的数组
 */
Graph.prototype.getAllDescendants=function(vertex){
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    //allV.add(vertex);
    while(true){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var descendants=self.getDescendants(v);

            for(var kk=0; kk<descendants.length; kk++){
                var descendant=descendants[kk];
                if(!allV.contains(descendant)){
                    currV.add(descendant);
                    allV.add(descendant);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return allV.toArray();
}

/**
 * 获取指定节点指定深度的后代
 * @param vertex 指定节点
 * @param depth 指定深度
 * @returns {*} 后代节点数组
 */
Graph.prototype.getDescendantsWithDepth= function (vertex, depth) {
    if(!this.containsVertex(vertex)){
        return new Array();
    }

    var allV=new buckets.Set();
    var prevV=new buckets.Set();
    prevV.add(vertex);
    //allV.add(vertex);
    for(var ii=0; ii<depth; ii++){
        var currV=new buckets.Set();
        var self=this;

        prevV.forEach(function(v){

            var descendants=self.getDescendants(v);

            for(var kk=0; kk<descendants.length; kk++){
                var descendant=descendants[kk];
                if(!allV.contains(descendant)){
                    currV.add(descendant);
                    allV.add(descendant);
                }
            }
        });

        prevV.clear();
        var parry=currV.toArray();
        for(var jj=0; jj<parry.length; jj++){
            prevV.add(parry[jj]);
        }
        if(currV.size()==0){
            break;
        }
    }

    return prevV.toArray();
}

/**
 * 依据连通性对节点进行聚类
 * @returns {Array} 2维数组 第一纬度是类别，第二纬度是该聚类内的节点
 */
Graph.prototype.clusterByConnective=function(){
    var clusters=new Array();
    var visited=new buckets.Set();

    var vs=this.getVertices();
    for(var ii=0; ii<vs.length; ii++){
        var v=vs[ii];
        if(!visited.contains(v)){
            visited.add(v)
            var nv=this.getAllNeighbours(v);
            for(var jj=0; jj<nv.length; jj++){
                visited.add(nv[jj]);
            }
            clusters.push(nv);
        }
    }

    console.log("total "+clusters.length+" clusters");

    return clusters;
}

/**
 * 获取与指定节点相连接的所有连边
 * @param vertex 指定节点
 * @returns {Array} 连边数组
 */
Graph.prototype.getConnectedEdges=function(vertex){
    var earray=new Array();
    var iarray=this.getInEdges(vertex);
    var oarray=this.getOutEdges(vertex);

    for(var ii=0; ii<iarray.length; ii++){
        earray.push(iarray[ii]);
    }

    for(var ii=0; ii<oarray.length; ii++){
        earray.push(oarray[ii]);
    }

    return earray;
}

/**
 * 获取指向节点的所有连边
 * @param vertex 指定节点
 * @returns {*} 连边数组
 */
Graph.prototype.getInEdges=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getFirst().values();
    }

    return new Array();
}

/**
 * 获取指出节点的所有连边
 * @param vertex 指定节点
 * @returns {*} 连边数组
 */
Graph.prototype.getOutEdges=function(vertex){
    if(this.containsVertex(vertex)){
        return this.vertices.get(vertex).getSecond().values();
    }

    return new Array();
}


/**
 * 获取指定边的端点
 * @param edge 指定边
 * @returns {Pair} 端点对，若图中不包含该边则返回null
 */
Graph.prototype.getEndPoints=function(edge){
    if(this.edges.containsKey(edge)){
        return this.edges.get(edge);
    }

    return null;
}

/**
 * 获取指定边的起始节点
 * @param edge 指定边
 * @returns {*} 起始节点，若图中不包含该边则返回null
 */
Graph.prototype.getFromPoint=function(edge){
    if(this.edges.containsKey(edge)){
        return this.edges.get(edge).getFirst();
    }

    return null;
}

/**
 * 获取指定边的结束节点
 * @param edge 指定边
 * @returns {*} 结束节点，若图中不包含该边则返回null
 */
Graph.prototype.getToPoint=function(edge){
    if(this.edges.containsKey(edge)){
        return this.edges.get(edge).getSecond();
    }
}

/**
 * 获取指定边的来源边
 * @param edge 指定边
 * @returns {*} 汇入指定边的所有边的数组
 */
Graph.prototype.getSourceEdges=function(edge){
    if(this.containsEdge(edge)){
        var from=this.getFromPoint(edge);
        return this.getInEdges(from);
    }

    return null;
}

/**
 * 获取指定边的目标边
 * @param edge 目标边
 * @returns {*} 流出指定边的所有边的数组
 */
Graph.prototype.getDestinationEdges=function(edge){
    if(this.containsEdge(edge)){
        var to=this.getToPoint(edge);
        return this.getOutEdges(to);
    }
}

//_______________________________________________________________________________

/**
 * 有序值对结构
 * @param first
 * @param second
 * @constructor
 */
function Pair(first, second){
    this.firstValue=first;
    this.secondValue=second;
}

/**
 * 获取第一个值
 * @returns {*} 第一个值
 */
Pair.prototype.getFirst=function(){
    return this.firstValue;
}

/**
 * 获取第二个值
 * @returns {*} 第二个值
 */
Pair.prototype.getSecond=function(){
    return this.secondValue;
}