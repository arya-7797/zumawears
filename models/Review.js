// const reviewSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   rating: {
//     type: Number,
//     min: 0,
//     max: 5,
//     required: true
//   },
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true
//   },
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const Review = mongoose.model('Review', reviewSchema);
