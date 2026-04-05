import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Wand2, Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { cn, formatImageUrl } from '@/lib/utils'
import { useRecipe, useCreateRecipe, useUpdateRecipe, useScrapeRecipe, useGenerateRecipe } from '@/hooks/useRecipes'
import type { RecipeFormData, RecipeDifficulty } from '@/types'

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
  prepTime: z.coerce.number().nullable().optional(),
  cookTime: z.coerce.number().nullable().optional(),
  restTime: z.coerce.number().nullable().optional(),
  servings: z.coerce.number().nullable().optional(),
  ingredients: z.string().optional().default(''),
  instructions: z.string().optional().default(''),
  equipment: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  cuisineType: z.string().optional().default(''),
  mealType: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  imageUrl: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional()
})

type FormValues = z.infer<typeof recipeSchema>

export function RecipeFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const { data: existing, isLoading: loadingExisting } = useRecipe(id)
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()
  const scrapeRecipe = useScrapeRecipe()
  const generateRecipe = useGenerateRecipe()

  const [scrapeUrl, setScrapeUrl] = useState('')
  const [showScrape, setShowScrape] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAi, setShowAi] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'EASY',
      ingredients: '',
      instructions: '',
      equipment: '',
      notes: '',
      cuisineType: '',
      mealType: '',
      tags: [],
      isPublic: false,
      imageUrl: null,
      sourceUrl: null
    }
  })

  const tags = watch('tags')
  const imageUrl = watch('imageUrl')

  // Populate form when editing
  useEffect(() => {
    if (existing && isEditing) {
      reset({
        title: existing.title,
        description: existing.description || '',
        difficulty: existing.difficulty,
        prepTime: existing.prepTime,
        cookTime: existing.cookTime,
        restTime: existing.restTime,
        servings: existing.servings,
        ingredients: existing.ingredients || '',
        instructions: existing.instructions || '',
        equipment: existing.equipment || '',
        notes: existing.notes || '',
        cuisineType: existing.cuisineType || '',
        mealType: existing.mealType || '',
        tags: existing.tags || [],
        isPublic: existing.isPublic,
        imageUrl: existing.imageUrl,
        sourceUrl: existing.sourceUrl
      })
    }
  }, [existing, isEditing, reset])

  const onSubmit = async (data: FormValues): Promise<void> => {
    try {
      const payload: RecipeFormData = {
        ...data,
        description: data.description || '',
        prepTime: data.prepTime || null,
        cookTime: data.cookTime || null,
        restTime: data.restTime || null,
        servings: data.servings || null,
        imageUrl: data.imageUrl || null,
        sourceUrl: data.sourceUrl || null
      }

      if (isEditing) {
        await updateRecipe.mutateAsync({ id, ...payload })
        toast.success('Recipe updated')
      } else {
        const recipe = await createRecipe.mutateAsync(payload)
        toast.success('Recipe created')
        navigate(`/recipes/${recipe.id}`, { replace: true })
        return
      }
      navigate(-1)
    } catch {
      toast.error(isEditing ? 'Failed to update recipe' : 'Failed to create recipe')
    }
  }

  const handleScrape = async (): Promise<void> => {
    if (!scrapeUrl.trim()) return
    try {
      const data = await scrapeRecipe.mutateAsync(scrapeUrl)
      if (data) {
        if (data.title) setValue('title', data.title)
        if (data.description) setValue('description', data.description)
        if (data.ingredients) setValue('ingredients', Array.isArray(data.ingredients) ? data.ingredients.join('\n') : data.ingredients)
        if (data.instructions) setValue('instructions', Array.isArray(data.instructions) ? data.instructions.join('\n') : data.instructions)
        if (data.prepTime) setValue('prepTime', data.prepTime)
        if (data.cookTime) setValue('cookTime', data.cookTime)
        if (data.servings) setValue('servings', data.servings)
        if (data.imageUrl) setValue('imageUrl', data.imageUrl)
        setValue('sourceUrl', scrapeUrl)
        toast.success('Recipe imported from URL')
        setShowScrape(false)
        setScrapeUrl('')
      }
    } catch {
      toast.error('Failed to scrape recipe from URL')
    }
  }

  const handleGenerate = async (): Promise<void> => {
    if (!aiPrompt.trim()) return
    try {
      const data = await generateRecipe.mutateAsync(aiPrompt)
      if (data) {
        if (data.title) setValue('title', data.title)
        if (data.description) setValue('description', data.description)
        if (data.ingredients) setValue('ingredients', Array.isArray(data.ingredients) ? data.ingredients.join('\n') : data.ingredients)
        if (data.instructions) setValue('instructions', Array.isArray(data.instructions) ? data.instructions.join('\n') : data.instructions)
        if (data.prepTime) setValue('prepTime', data.prepTime)
        if (data.cookTime) setValue('cookTime', data.cookTime)
        if (data.servings) setValue('servings', data.servings)
        if (data.equipment) setValue('equipment', Array.isArray(data.equipment) ? data.equipment.join('\n') : data.equipment)
        if (data.notes) setValue('notes', data.notes)
        toast.success('Recipe generated')
        setShowAi(false)
        setAiPrompt('')
      }
    } catch {
      toast.error('Failed to generate recipe')
    }
  }

  const addTag = (): void => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setValue('tags', [...tags, tag])
    }
    setTagInput('')
  }

  if (isEditing && loadingExisting) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-heading text-2xl font-bold">
          {isEditing ? 'Edit Recipe' : 'New Recipe'}
        </h1>
        <div className="w-16" />
      </div>

      {/* Import actions */}
      {!isEditing && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowScrape(!showScrape)
              setShowAi(false)
            }}
            className="gap-2"
          >
            <LinkIcon size={14} />
            Import from URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAi(!showAi)
              setShowScrape(false)
            }}
            className="gap-2"
          >
            <Wand2 size={14} />
            AI Generate
          </Button>
        </div>
      )}

      {/* Scrape modal */}
      {showScrape && (
        <div className="glass rounded-lg p-4 space-y-3 animate-slide-up">
          <p className="text-sm font-medium">Import recipe from a URL</p>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/recipe"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
            <Button onClick={handleScrape} disabled={scrapeRecipe.isPending} size="sm">
              {scrapeRecipe.isPending ? <Loader size={14} /> : 'Import'}
            </Button>
          </div>
        </div>
      )}

      {/* AI generate modal */}
      {showAi && (
        <div className="glass rounded-lg p-4 space-y-3 animate-slide-up">
          <p className="text-sm font-medium">Describe the recipe you want</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. A spicy Thai green curry with tofu"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button onClick={handleGenerate} disabled={generateRecipe.isPending} size="sm">
              {generateRecipe.isPending ? <Loader size={14} /> : 'Generate'}
            </Button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image preview */}
        {imageUrl && (
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={formatImageUrl(imageUrl) || imageUrl}
              alt="Recipe"
              className="w-full aspect-[16/9] object-cover"
            />
            <button
              type="button"
              onClick={() => setValue('imageUrl', null)}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Image URL input */}
        <div className="space-y-2">
          <Label>Image URL</Label>
          <div className="flex gap-2">
            <Input placeholder="Paste image URL" {...register('imageUrl')} />
            <Button type="button" variant="outline" size="icon">
              <ImageIcon size={16} />
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="Recipe title" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Brief description"
            {...register('description')}
          />
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
              {...register('difficulty')}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Prep (min)</Label>
            <Input type="number" {...register('prepTime')} />
          </div>
          <div className="space-y-2">
            <Label>Cook (min)</Label>
            <Input type="number" {...register('cookTime')} />
          </div>
          <div className="space-y-2">
            <Label>Servings</Label>
            <Input type="number" {...register('servings')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cuisine Type</Label>
            <Input placeholder="e.g. Italian" {...register('cuisineType')} />
          </div>
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Input placeholder="e.g. Dinner" {...register('mealType')} />
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients</Label>
          <textarea
            id="ingredients"
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm min-h-[150px] font-mono text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="One ingredient per line"
            {...register('ingredients')}
          />
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <textarea
            id="instructions"
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm min-h-[200px] font-mono text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="One step per line"
            {...register('instructions')}
          />
        </div>

        {/* Equipment */}
        <div className="space-y-2">
          <Label htmlFor="equipment">Equipment</Label>
          <textarea
            id="equipment"
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Required equipment"
            {...register('equipment')}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Tips, variations, storage..."
            {...register('notes')}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setValue('tags', tags.filter((t) => t !== tag))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Public toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="rounded" {...register('isPublic')} />
          <span className="text-sm">Make this recipe public</span>
        </label>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? <Loader size={16} className="text-white" /> : isEditing ? 'Save Changes' : 'Create Recipe'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
