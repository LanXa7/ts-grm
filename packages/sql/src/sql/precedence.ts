export const enum Precedence {

    ROOT       = 0,

    // or
    OR         = 10,

    // and
    AND        = 20,

    // =, <>, <, >, <=, >=, like, ilike, in, between
    COMPARISON = 30,

    // +, -, concat
    PLUS        = 40,

    // *, /, %
    TIMES   = 50,

    // unary-, not, is null, is not null, exists, not exists
    UNARY      = 60,

    // literal, column, parameter, 
    // function, case, subquery, native
    PRIMARY    = 70, 
}