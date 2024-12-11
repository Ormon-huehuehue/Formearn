import z from "zod"

export const createTaskInput = z.object({
    options : z.array(z.object({
        image_url : z.string(),
    })),
    title : z.string(),
    signature : z.string()
})

export const createSubmissioninput = z.object({
    selection : z.number(),
    task_id : z.number()
})