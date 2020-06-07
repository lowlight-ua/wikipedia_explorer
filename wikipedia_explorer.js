'use strict';

let appl = {};

// ----------------------------------------------------------------------------

class JSONSet extends Set {
    toJSON () {
        return [...this]
    }
}

// ----------------------------------------------------------------------------

class Graph
{
    constructor()
    {
        this.linksOut = {};
        this.linksIn = {};
        this.searchOut = {};
        this.centerArticle = "";
    }

    addLink(from, to)
    {
        if (!(from in this.linksOut))
        {
            this.linksOut[from] = new JSONSet();
        }
        this.linksOut[from].add(to);

        if (!(to in this.linksIn))
        {
            this.linksIn[to] = new JSONSet();
        }
        this.linksIn[to].add(from);
    }

    addSearchOut(term, results)
    {
	    if (!(term in this.searchOut))
        {
            this.searchOut[term] = new JSONSet();
        }	
        this.searchOut[term].add(results);
    }
}

// ----------------------------------------------------------------------------

class Application
{
    constructor()
    {
        this.graph = new Graph();
        this.steps = 3;
    }

    gotWikiLinks(data)
    {
        const dqp = data.query.pages;
        const links = dqp[Object.keys(dqp)[0]].links;
        let graph = this.graph;
        const titles = links.forEach(x => graph.addLink(graph.centerArticle, x.title));
        this.onStepComplete();
    }

    gotWikiBacklinks(data)
    {
        const dqp = data.query.pages;
        const linkshere = dqp[Object.keys(dqp)[0]].linkshere;
        let graph = this.graph;
        const titles = linkshere.forEach(x => graph.addLink(x.title, graph.centerArticle));
        this.onStepComplete();
    }

    gotWikiSearchResult(data)
    {
        const dqs = data.query.search;
        let graph = this.graph;
        const titles = dqs.forEach(x => graph.addSearchOut(graph.centerArticle, x.title));
        this.onStepComplete();
    }

    onStepComplete()
    {
        this.steps--;
        if (this.steps == 0)
        {
            this.onOperationComplete();
        }
    }

    onOperationComplete()
    {
        const related = [];
        const graph = this.graph;
        const linksOut =  graph.linksOut[graph.centerArticle];
        const linksIn  =  graph.linksIn[graph.centerArticle];            
        const searchOut  =  graph.searchOut[graph.centerArticle];

        for (var it = linksOut.values(), val= null; val=it.next().value; ) 
        {
            const linkRank = linksIn.has(val) + linksIn.has(val) + searchOut.has(val);
            if (!related[linkRank])
            {
                related[linkRank] = [];
            }
            related[linkRank].push(val);
        }

        for(let i=related.length - 1; i >= 0; i--)
        {
            const articles = related[i];
            if (articles)
            {
                for(let j=0; j < articles.length; j++)
                {
                    $("#json_out").append(i + "   " + related[i][j] + "\n");
                }
            }
        }
    }
}