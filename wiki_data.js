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

class WikiData
{
    articles = {};

    article(title) {
        if (!this.articles[title]) {
            this.articles[title] = new Article(title);
        }
        return this.articles[title];
    }
}