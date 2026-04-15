import { describe, it } from "vitest";
import { SIMPLE_COURSE_VIEW, SIMPLE_STUDENT_VIEW, sql, sqlClient } from "./utils";
import { COURSE, STUDENT } from "../model/model";
import { expectCode } from "../utils";

describe("JoinEntitySqlTest", () => {

    it("joinEntity", () => {
        const q = sqlClient.createQuery(STUDENT, (q, student) => {
            q.where(
                student.courses().$acceptMulti().name.eq("English")
            );
            return q.select(
                student.fetch(SIMPLE_STUDENT_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from STUDENT tb_1_
            inner join LEARNING_LINK tb_2_ on 
                tb_1_.ID = tb_2_.STUDENT_ID
            inner join COURSE tb_3_ on 
                tb_2_.COURSE_ID = tb_3_.ID
            where 
                tb_3_.NAME = ?
        `);
    });

    it("inverseJoinEntity", () => {
        const q = sqlClient.createQuery(COURSE, (q, course) => {
            q.where(
                course.students().$acceptMulti().name.eq("Tom")
            );
            return q.select(
                course.fetch(SIMPLE_COURSE_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from COURSE tb_1_
            inner join LEARNING_LINK tb_2_ on 
                tb_1_.ID = tb_2_.COURSE_ID
            inner join STUDENT tb_3_ on 
                tb_2_.STUDENT_ID = tb_3_.ID
            where 
                tb_3_.NAME = ?
        `);
    });

    it("idOnly", () => {
        const q = sqlClient.createQuery(STUDENT, (q, student) => {
            q.where(
                student.courses().$acceptMulti().id.eq(1)
            );
            return q.select(
                student.fetch(SIMPLE_STUDENT_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from STUDENT tb_1_
            inner join LEARNING_LINK tb_2_ on 
                tb_1_.ID = tb_2_.STUDENT_ID
            where 
                tb_2_.COURSE_ID = ?
        `);
    });

    it("inverseIdOnly", () => {
        const q = sqlClient.createQuery(COURSE, (q, course) => {
            q.where(
                course.students().$acceptMulti().id.eq(3)
            );
            return q.select(
                course.fetch(SIMPLE_COURSE_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from COURSE tb_1_
            inner join LEARNING_LINK tb_2_ on 
                tb_1_.ID = tb_2_.COURSE_ID
            where 
                tb_2_.STUDENT_ID = ?
        `);
    });

    it("mixed", () => {
        const q = sqlClient.createQuery(STUDENT, (q, student) => {
            q.where(
                student.courses().$acceptMulti().name.eq("English"),
                student.learningLinks().$acceptMulti().score.isNotNull()
            );
            return q.select(
                student.fetch(SIMPLE_STUDENT_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from STUDENT tb_1_
            inner join LEARNING_LINK tb_2_ on 
                tb_1_.ID = tb_2_.STUDENT_ID
            inner join COURSE tb_3_ on 
                tb_2_.COURSE_ID = tb_3_.ID
            where 
                    tb_3_.NAME = ?
                and
                    tb_2_.SCORE is not null
        `);
    });

    it("every", () => {
        const q = sqlClient.createQuery(STUDENT, (q, student) => {
            q.where(
                student.every("courses", course => course.name.length().gt(10))
            );
            return q.select(
                student.fetch(SIMPLE_STUDENT_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from STUDENT tb_1_
            where 
                not exists(
                    select 
                        1
                    from COURSE tb_2_
                    inner join LEARNING_LINK tb_3_ on 
                        tb_2_.ID = tb_3_.COURSE_ID
                    where 
                            tb_3_.STUDENT_ID = tb_1_.ID
                        and
                            length(cast(tb_2_.NAME as text)) <= ?
                )
        `);
    });

    it("inverseEvery", () => {
        const q = sqlClient.createQuery(COURSE, (q, course) => {
            q.where(
                course.every("students", student => student.name.length().gt(10))
            );
            return q.select(
                course.fetch(SIMPLE_COURSE_VIEW)
            )
        });
        expectCode(sql(q), `
            select 
                tb_1_.ID,
                tb_1_.NAME
            from COURSE tb_1_
            where 
                not exists(
                    select 
                        1
                    from STUDENT tb_2_
                    inner join LEARNING_LINK tb_3_ on 
                        tb_2_.ID = tb_3_.STUDENT_ID
                    where 
                            tb_3_.COURSE_ID = tb_1_.ID
                        and
                            length(cast(tb_2_.NAME as text)) <= ?
                )
        `);
    });
});