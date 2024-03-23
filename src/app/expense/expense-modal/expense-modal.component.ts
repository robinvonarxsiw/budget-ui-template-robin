import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { filter, from } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { Category, Expense } from '../../shared/domain';
import { ExpenseService } from '../expense.service';
import { CategoryService } from '../../category/category.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../shared/service/toast.service';
import { formatISO, parseISO } from 'date-fns';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  readonly expenseForm: FormGroup;
  submitting = false;

  categories: Category[] = [];
  expense: Expense = {} as Expense;

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly categoryService: CategoryService,
    private readonly formBuilder: FormBuilder,
    private readonly toastService: ToastService,
    private readonly expenseService: ExpenseService,
  ) {
    this.expenseForm = this.formBuilder.group({
      id: [], //hidden
      categoryId: [],
      name: ['', [Validators.required, Validators.maxLength(40)]],
      amount: ['', [Validators.required, Validators.pattern(/^\d+$/)]], // Prüfung, damit nur Zahlen zugelassen sind
      date: [formatISO(new Date())],
    });
  }

  // Load all categories
  private loadAllCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: (categories) => (this.categories = categories),
      error: (error) => this.toastService.displayErrorToast('Could not load categories', error),
    });
  }

  // Cancel Methode
  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // Save Methode
  save(): void {
    this.modalCtrl.dismiss(null, 'save');
    this.expenseService.upsertExpense({
      ...this.expenseForm.value,
      date: formatISO(parseISO(this.expenseForm.value.date), { representation: 'date' }),
    });
  }

  // Delete Methode
  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(filter((action) => action === 'delete'))
      .subscribe(() => this.modalCtrl.dismiss(null, 'delete'));
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }
}
