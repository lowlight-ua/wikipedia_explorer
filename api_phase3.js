// In this file:
// API calls that allow to generate a limited category graph, allowing to link the 
// discovered categories with themselves and parents/descendants of several generations.

//-----------------------------------------------------------------------------

class ApiCall_CategoryParents extends ApiCallBase
{
    generation; 

    constructor(transaction, model, generation) {
        super(transaction, model);
        this.generation = generation;
    }

    run() {
    }
}




