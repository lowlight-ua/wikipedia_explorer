'use strict';

//-----------------------------------------------------------------------------

// The data model for the application stores two types of objects: Articles and Categories.
// There are two kinds of ways an Article or Category can be stored:
//
// 1) *As an object* of `Category` or `Article`: Only "interesting" categories and objects are
// stored this way, where "interesting" means "eventually displayed in the graph".
// Only the `Model` stores these objects in this way.
// 
// 2) *As a string*, where the string is the title of article/category. All articles and
// categories harvested by API calls are stored in this way. References to other articles and 
// categories from within `Article` and `Category` objects are always simple strings, not
// object references.

//-----------------------------------------------------------------------------

class Category
{
    title;

    // 0: discovered during phase1. 
    // Negative: generations of ancestor categories. (Only one generation currently.)
    // Positive: generations of descendant categories. (Not used currently.)
    generation; 

    // All articles in this category
    articles = new Set();

    // All articles in this category and all the descendant categories
    articlesDeep = new Set();

    // Parent categories
    parents = new Set();

    // Child categories
    children = new Set();

    constructor(title, generation = 0) { 
        this.title = title; 
        this.generation = generation;
    }
}

//-----------------------------------------------------------------------------

class Article 
{
    title;
    openingText;

    // Related articles.

        // Incoming links into this article, except from transcluded content.
        // Sorted by relevance.
        linksTo = [];

        // Links from this article. Unsorted.
        linksFrom = [];
        
        // Links from this article, only from "see also" section. Unsorted.
        linksFromSeeAlso = [];

        // Links that the search finds when we search for the article title.
        // Sorted by relevance.
        moreLike = [];

    // Categories that the artile belongs to.
    categories = [];

    // Categories that the artile belongs to, and all parent categories of that category.
    categoriesDeep = new Set();

    // "Page assessments", includes wikiproject information.
    // Key = wikiproject; value object = page assessments.
    // (Currently unused, good to use for ranking.)
    assessments = {};

    constructor(value) {
        if(!value) { throw new Error("Empty title"); }
        this.title = value;
    }
}

//-----------------------------------------------------------------------------

class Model
{
    // key = article title; value = instance of `Article`
    articles = {};
    // key = category title; value = instance of `Category`
    categories = {};

    touchArticle(title) {
        if (!this.articles[title]) {
            this.articles[title] = new Article(title);
        }
        return this.articles[title];
    }

    touchCategory(category) {
        if (!this.categories[category]) {
            this.categories[category] = new Category(category);
        }
    }

    // Called when an inbound link is found for an article.
    articleLinkTo(artTarget, strSource) {
        artTarget.linksTo.push(strSource);
        const src = this.touchArticle(strSource);
        src.linksFrom.push(artTarget.title);
    }

    // Called when an outgoing link is found from an article.
    articleLinkFrom(artSource, strTarget) {
        artSource.linksFrom.push(strTarget);

        // No "this.touchArticle(strTarget);", because outgoing links are very noisy,
        // so they are not "interesting" unless something else gives them rank,
        // in which case they will be added to the `Model` anyway.
    }

    // Called when a Wikipedia search finds a related article.
    articleMoreLike(article, strRelated) {
        article.moreLike.push(strRelated);
        this.touchArticle(strRelated);
    }

    // Called when an outbound link is found in the "See also" section of the article.
    articleLinkFromSeeAlso(article, strRelated) {
        article.linksFromSeeAlso.push(strRelated);
        this.touchArticle(strRelated);
    }

    // Called when a category of an article is determined.
    articleCategories(article, category) {
        if(category.indexOf('stub') == -1 &&        // Disregard caterories with the word "stub"
        category.indexOf('isambigua') == -1) {      // Disregard disambiguation categories
            article.categories.push(category);
            article.categoriesDeep.add(category);
            this.touchCategory(category);
            this.categories[category].articles.add(article.title);
            this.categories[category].articlesDeep.add(article.title);    
        }
    }

    // Called when a parent category of a category is determined.
    // newGeneration is the generation index of the newly found parent category.
    categoryParents(childCat, parentTitle, newGeneration) {
        childCat.parents.add(parentTitle);
        const parentCat = this.categories[parentTitle];
        if (parentCat) {
            parentCat.children.add(childCat.title);
            for(let i of childCat.articlesDeep) {
                parentCat.articlesDeep.add(i);
                this.articles[i].categoriesDeep.add(parentTitle);
            }
            parentCat.generation = newGeneration;
        }
     }

    deleteArticle(title) {
        delete this.articles[title];
    }
}