'use strict';

class Article 
{
    title;
    // Incoming links into this article, except from transcluded content.
    linksTo = [];
    // Links from this article.
    linksFrom = [];
    // Links from this article, only from "see also" section.
    linksFromSeeAlso = [];
    // Links that the search finds when we search for the article title.
    moreLike = [];
    // Categories that the artile belongs to.
    categories = [];
    // "Page assessments", includes wikiproject information.
    assessments = {};

    constructor(value) {
        if(!value) { throw new Error("Empty title"); }
        this.title = value;
    }
}

//-----------------------------------------------------------------------------

class Model
{
    articles = {};
    categories = {};

    touchArticle(title) {
        if (!this.articles[title]) {
            this.articles[title] = new Article(title);
        }
    }

    articleLinkTo(artTarget, strSource) {
        artTarget.linksTo.push(strSource);
        this.touchArticle(strSource);
    }

    articleLinkFrom(artSource, strTarget) {
        artSource.linksFrom.push(strTarget);
        
        // don't do it for now
        // this.touchArticle(strTarget);
    }

    articleMoreLike(article, strRelated) {
        article.moreLike.push(strRelated);
        this.touchArticle(strRelated);
    }

    articleLinkFromSeeAlso(article, strRelated) {
        article.linksFromSeeAlso.push(strRelated);
        this.touchArticle(strRelated);
    }

}