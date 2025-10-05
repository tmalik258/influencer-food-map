# Video Processing Status Implementation Plan

## Overview
This document outlines the complete implementation plan for adding a `processed` column to track video processing status across the entire application. The changes will affect the database schema, backend services, API schemas, and frontend components.

## 1. Database Schema Changes

### 1.1 Add processed column to Video model
**File:** `backend/app/models/video.py`

Add a new boolean column `processed` to the Video model:

```python
class Video(Base):
    __tablename__ = "videos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id = Column(UUID(as_uuid=True), ForeignKey("influencers.id"), nullable=False)
    youtube_video_id = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String, nullable=False)
    published_at = Column(DateTime, nullable=True)
    transcription = Column(Text, nullable=True)
    processed = Column(Boolean, default=False, nullable=False)  # NEW COLUMN
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

### 1.2 Database Migration
Create a new Alembic migration to add the column:

```python
# In migration file
def upgrade():
    op.add_column('videos', sa.Column('processed', sa.Boolean(), nullable=False, server_default='false'))
    
def downgrade():
    op.drop_column('videos', 'processed')
```

### 1.3 Existing Data Migration Strategy
- All existing videos will have `processed = false` by default (using server_default)
- Videos that have already been processed can be identified by checking if they have listings or completed processing jobs
- Consider running a one-time script to update `processed = true` for videos that already have listings

## 2. Backend Service Updates

### 2.1 Update transcription_nlp.py
**File:** `backend/app/services/transcription_nlp.py`

Add logic to mark videos as processed when processing completes successfully:

```python
async def process_video_transcription(video_id: str, db: AsyncSession):
    """Process video transcription and mark video as processed"""
    try:
        # Existing processing logic...
        
        # After successful processing, mark video as processed
        video = await db.get(Video, video_id)
        if video:
            video.processed = True
            await db.commit()
            
    except Exception as e:
        # Log error and potentially mark as failed
        logger.error(f"Failed to process video {video_id}: {str(e)}")
        raise
```

### 2.2 Update Video Processing Jobs Service
**File:** `backend/app/services/video_processing_jobs.py`

Add method to update video processed status based on job completion:

```python
async def update_video_processed_status(video_id: str, processed: bool, db: AsyncSession):
    """Update the processed status of a video"""
    video = await db.get(Video, video_id)
    if video:
        video.processed = processed
        await db.commit()
        return video
    return None
```

### 2.3 Update Admin Video Actions
**File:** `backend/app/routes/admin/videos.py`

Add processed field to video update endpoints:

```python
@router.put("/admin/videos/{video_id}")
async def update_video(
    video_id: str,
    video_update: VideoUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    # Existing logic...
    
    # Update processed field if provided
    if video_update.processed is not None:
        video.processed = video_update.processed
    
    await db.commit()
    return video
```

## 3. API Schema Updates

### 3.1 Update Video Response Schemas
**File:** `backend/app/api_schema/videos.py`

Add processed field to all video response schemas:

```python
class VideoResponse(BaseModel):
    id: UUID
    influencer: Optional[InfluencerLightResponse] = None
    youtube_video_id: str
    title: str
    description: Optional[str] = None
    video_url: str
    published_at: Optional[datetime] = None
    transcription: Optional[str] = None
    processed: bool = False  # NEW FIELD
    created_at: datetime
    updated_at: datetime
    listings_count: int = 0

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    published_at: Optional[datetime] = None
    transcription: Optional[str] = None
    processed: Optional[bool] = None  # NEW FIELD
```

## 4. Frontend Type Definitions

### 4.1 Update Video Interface
**File:** `frontend/lib/types/index.ts`

Add processed field to Video interface:

```typescript
export interface Video {
  id: string;
  influencer?: Influencer;
  youtube_video_id: string;
  title: string;
  description?: string;
  video_url: string;
  published_at?: string;
  transcription?: string;
  processed?: boolean;  // NEW FIELD
  created_at: string;
  updated_at: string;
  listings_count?: number;
}
```

### 4.2 Update Video Validation Schemas
**File:** `frontend/lib/validations/video.ts`

Add processed field to update schema:

```typescript
export const updateVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  video_url: z.string().url("Must be a valid URL"),
  published_at: z.date().nullable(),
  transcription: z.string().optional(),
  processed: z.boolean().optional(),  // NEW FIELD
});
```

## 5. Frontend Dashboard Updates

### 5.1 Update Video Table Component
**File:** `frontend/app/dashboard/videos/_components/video-table.tsx`

Add processed status column to the table:

```typescript
// Add to table header
<TableHead>Processed</TableHead>

// Add to table row
<TableCell>
  <div className="flex items-center gap-2">
    {video.processed ? (
      <Badge variant="success" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Processed
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )}
  </div>
</TableCell>
```

### 5.2 Update Edit Video Modal
**File:** `frontend/app/dashboard/videos/_components/edit-video-modal.tsx`

Add processed checkbox to the edit form:

```typescript
// Add to form fields
<FormField
  control={form.control}
  name="processed"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Processed</FormLabel>
        <FormDescription>
          Mark this video as processed
        </FormDescription>
      </div>
    </FormItem>
  )}
/>
```

### 5.3 Add Processing Status Filter
**File:** `frontend/app/dashboard/videos/_components/video-filters.tsx`

Add filter option for processed status:

```typescript
// Add to filter interface
export interface VideoFiltersProps {
  // ... existing props
  processedFilter?: boolean | null;
  setProcessedFilter?: (value: boolean | null) => void;
}

// Add filter UI
<Select
  value={processedFilter === null ? 'all' : processedFilter.toString()}
  onValueChange={(value) => {
    setProcessedFilter?.(value === 'all' ? null : value === 'true');
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="All videos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All videos</SelectItem>
    <SelectItem value="true">Processed</SelectItem>
    <SelectItem value="false">Not processed</SelectItem>
  </SelectContent>
</Select>
```

### 5.4 Update Video Management Component
**File:** `frontend/app/dashboard/videos/_components/video-management.tsx`

Add processed filter state and pass to components:

```typescript
const [processedFilter, setProcessedFilter] = useState<boolean | null>(null);

// Pass to useVideos hook
const {
  videos,
  // ... other props
} = useVideos({
  page: 1,
  limit: 10,
  sort_by: "published_at",
  sort_order: "desc",
  processed: processedFilter,  // NEW FILTER
});

// Pass to filters component
<VideoFilters
  // ... existing props
  processedFilter={processedFilter}
  setProcessedFilter={setProcessedFilter}
/>
```

## 6. Update API Actions

### 6.1 Update Video Actions
**File:** `frontend/lib/actions/video-actions.ts`

Add processed parameter to API calls:

```typescript
export const videoActions = {
  // ... existing methods
  
  async getVideos(params?: {
    page?: number;
    limit?: number;
    search?: string;
    processed?: boolean;  // NEW PARAMETER
    // ... other params
  }) {
    const queryParams = new URLSearchParams();
    if (params?.processed !== undefined) {
      queryParams.append('processed', params.processed.toString());
    }
    // ... add other params
    
    return apiClient.get(`/videos?${queryParams.toString()}`);
  }
};
```

### 6.2 Update Admin Video Actions
**File:** `frontend/lib/actions/admin-video-actions.ts`

Add processed field to update actions:

```typescript
interface VideoUpdateData {
  title?: string;
  description?: string;
  video_url?: string;
  published_at?: string;
  transcription?: string;
  processed?: boolean;  // NEW FIELD
}

export const adminVideoActions = {
  async updateVideo(videoId: string, data: VideoUpdateData) {
    return apiClient.put(`/admin/videos/${videoId}`, data);
  }
};
```

## 7. Testing Considerations

### 7.1 Backend Tests
- Test that processed field is properly set when video processing completes
- Test that processed filter works correctly in API endpoints
- Test that video update endpoints properly handle processed field

### 7.2 Frontend Tests
- Test that processed status displays correctly in video table
- Test that processed filter works correctly
- Test that edit modal properly updates processed status

## 8. Deployment Strategy

1. **Database Migration First**: Run the database migration to add the processed column
2. **Backend Deployment**: Deploy backend changes that handle the new field
3. **Frontend Deployment**: Deploy frontend changes to display and manage processed status
4. **Data Backfill**: Optionally run a script to update processed status for existing videos

## 9. Rollback Plan

If issues arise:
1. Rollback frontend changes first (no data impact)
2. Rollback backend changes (API will ignore processed field)
3. Remove database column migration (if necessary)

## 10. Monitoring and Validation

- Monitor API endpoints for proper processed field handling
- Validate that video processing jobs correctly update processed status
- Check that frontend displays are consistent with backend data
- Monitor for any performance impacts from additional filtering options